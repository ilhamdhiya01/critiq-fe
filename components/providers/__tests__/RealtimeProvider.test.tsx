import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRealtimeStatus } from "@/lib/hooks/useRealtimeStatus";

import RealtimeProvider from "../RealtimeProvider";

let currentOrgId: string | undefined = "org_1";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/lib/hooks/organisation/useOrgBySlug", () => ({
  useOrgBySlug: () => ({ orgId: currentOrgId }),
}));

type Listener = (event: { data: string }) => void;

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: MockEventSource[] = [];

  readyState = MockEventSource.CONNECTING;
  onerror: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Set<Listener>>();
  close = vi.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  constructor(
    public url: string,
    public init?: EventSourceInit,
  ) {
    MockEventSource.instances.push(this);
  }

  addEventListener(name: string, listener: Listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name)?.add(listener);
  }

  emit(name: string, data: object = {}) {
    act(() => {
      this.listeners
        .get(name)
        ?.forEach((listener) => listener({ data: JSON.stringify(data) }));
    });
  }

  fail(readyState: number) {
    act(() => {
      this.readyState = readyState;
      this.onerror?.(new Event("error"));
    });
  }
}

const latest = () =>
  MockEventSource.instances[MockEventSource.instances.length - 1];

const StatusProbe = () => <span>{useRealtimeStatus()}</span>;

const tree = (client: QueryClient) => (
  <QueryClientProvider client={client}>
    <RealtimeProvider>
      <StatusProbe />
    </RealtimeProvider>
  </QueryClientProvider>
);

const renderProvider = () => {
  const client = new QueryClient();
  const invalidate = vi
    .spyOn(client, "invalidateQueries")
    .mockResolvedValue(undefined);
  const view = render(tree(client));
  return { ...view, client, invalidate };
};

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

let visibility: DocumentVisibilityState = "visible";
const setVisibility = (state: DocumentVisibilityState) => {
  visibility = state;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

const COMMENT_EVENT = {
  type: "comment.updated",
  orgId: "org_1",
  repoId: "repo_1",
  pullId: "pr_1",
  commentId: "c1",
  change: "created",
};

describe("RealtimeProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentOrgId = "org_1";
    visibility = "visible";
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens one credentialed stream for the active org", () => {
    renderProvider();

    expect(MockEventSource.instances).toHaveLength(1);
    expect(latest().url).toBe("/orgs/org_1/events");
    expect(latest().init).toEqual({ withCredentials: true });
    expect(screen.getByText("connecting")).toBeInTheDocument();

    latest().emit("ready", { serverTime: "x", heartbeatMs: 25000 });
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("batches and dedupes invalidations from a burst of events", () => {
    const { invalidate } = renderProvider();
    latest().emit("ready");

    latest().emit("comment.updated", COMMENT_EVENT);
    latest().emit("comment.updated", { ...COMMENT_EVENT, commentId: "c2" });
    expect(invalidate).not.toHaveBeenCalled();

    advance(250);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pull-requests", "comments", "org_1", "repo_1", "pr_1"],
    });
  });

  it("ignores ping frames and unknown events", () => {
    const { invalidate } = renderProvider();
    latest().emit("ready");
    latest().emit("ping");
    latest().emit("billing.updated", { type: "billing.updated" });
    advance(1000);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes everything after a reconnect (missed events are not replayed)", () => {
    const { invalidate } = renderProvider();
    latest().emit("ready");
    advance(250);
    expect(invalidate).not.toHaveBeenCalled();

    // The browser reconnects by itself and the server sends `ready` again.
    latest().fail(MockEventSource.CONNECTING);
    expect(screen.getByText("connecting")).toBeInTheDocument();
    latest().emit("ready");
    advance(250);

    expect(invalidate.mock.calls.map(([arg]) => arg?.queryKey)).toEqual([
      ["pull-requests"],
      ["repositories"],
      ["integrations"],
      ["rules"],
      ["ai-settings"],
      ["dashboard"],
      ["activity"],
      ["members"],
      ["insights"],
    ]);
  });

  it("closes for good when the session expires", () => {
    const { invalidate } = renderProvider();
    const stream = latest();
    stream.emit("ready");
    stream.emit("revoked", { reason: "session_expired" });

    expect(stream.close).toHaveBeenCalled();
    expect(screen.getByText("unavailable")).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["user"] });

    advance(120_000);
    setVisibility("hidden");
    advance(130_000);
    setVisibility("visible");
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it("invalidates memberships when membership is revoked", () => {
    const { invalidate } = renderProvider();
    latest().emit("revoked", { reason: "membership_revoked" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["memberships"] });
  });

  it("falls back to polling and retries with backoff when unavailable", () => {
    renderProvider();
    latest().fail(MockEventSource.CLOSED);
    expect(screen.getByText("unavailable")).toBeInTheDocument();

    advance(4_999);
    expect(MockEventSource.instances).toHaveLength(1);
    advance(1);
    expect(MockEventSource.instances).toHaveLength(2);

    latest().fail(MockEventSource.CLOSED);
    advance(9_999);
    expect(MockEventSource.instances).toHaveLength(2);
    advance(1);
    expect(MockEventSource.instances).toHaveLength(3);

    // A successful `ready` resets the backoff.
    latest().emit("ready");
    latest().fail(MockEventSource.CLOSED);
    advance(5_000);
    expect(MockEventSource.instances).toHaveLength(4);
  });

  it("closes the old stream and opens a new one when the org changes", () => {
    const { rerender, client } = renderProvider();
    const first = latest();

    currentOrgId = "org_2";
    rerender(tree(client));

    expect(first.close).toHaveBeenCalled();
    expect(latest().url).toBe("/orgs/org_2/events");
  });

  it("closes after two minutes hidden and reconnects when visible", () => {
    const { invalidate } = renderProvider();
    const first = latest();
    first.emit("ready");

    setVisibility("hidden");
    advance(119_999);
    expect(first.close).not.toHaveBeenCalled();
    advance(1);
    expect(first.close).toHaveBeenCalled();

    setVisibility("visible");
    expect(MockEventSource.instances).toHaveLength(2);
    latest().emit("ready");
    advance(250);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pull-requests"] });
  });

  it("stays on polling without an org", () => {
    currentOrgId = undefined;
    renderProvider();

    expect(MockEventSource.instances).toHaveLength(0);
    expect(screen.getByText("unavailable")).toBeInTheDocument();
  });
});
