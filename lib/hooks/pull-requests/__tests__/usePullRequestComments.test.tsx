import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CommentThread } from "@/lib/types/pull-request.types";
import { getPullRequestComments } from "@/services/pull-requests.service";

import { usePullRequestComments } from "../usePullRequestComments";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestComments: vi.fn(),
}));

const thread = (
  id: string,
  overrides: Partial<CommentThread> = {},
): CommentThread => ({
  id,
  kind: "inline",
  path: "src/app.ts",
  line: 10,
  side: "new",
  headSha: "abc",
  outdated: false,
  comments: [],
  ...overrides,
});

const pending = (id: string) =>
  thread(id, {
    kind: "general",
    comments: [{ sync: { status: "pending" } }] as never,
  });

const respond = (threads: CommentThread[]) => ({ data: { threads } });

const setup = (repoId = "repo_1") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => usePullRequestComments("org_1", repoId, "pr_1"),
    { wrapper },
  );
  return { result };
};

describe("usePullRequestComments", () => {
  afterEach(() => vi.mocked(getPullRequestComments).mockReset());

  it("waits until every id is known", () => {
    setup("");

    expect(getPullRequestComments).not.toHaveBeenCalled();
  });

  it("groups threads into general, inline-by-line and outdated", async () => {
    const general = thread("t_general", { kind: "general", path: null });
    const first = thread("t_1");
    const second = thread("t_2");
    const oldSide = thread("t_old_side", { side: "old", line: 4 });
    const outdated = thread("t_outdated", { outdated: true });
    const noLine = thread("t_no_line", { line: null });
    vi.mocked(getPullRequestComments).mockResolvedValue(
      respond([general, first, second, oldSide, outdated, noLine]),
    );

    const { result } = setup();

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({
      general: [general],
      inlineByKey: {
        "src/app.ts:new:10": [first, second],
        "src/app.ts:old:4": [oldSide],
      },
      outdated: [outdated],
    });
    expect(getPullRequestComments).toHaveBeenCalledWith(
      "org_1",
      "repo_1",
      "pr_1",
    );
  });

  it("handles a response without threads", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue({
      data: null,
    } as never);

    const { result } = setup();

    await waitFor(() =>
      expect(result.current.data).toEqual({
        general: [],
        inlineByKey: {},
        outdated: [],
      }),
    );
  });

  it("polls fast while a comment is syncing to the provider", async () => {
    vi.mocked(getPullRequestComments)
      .mockResolvedValueOnce(respond([pending("t_1")]))
      .mockResolvedValue(respond([thread("t_1", { kind: "general" })]));

    setup();

    await waitFor(
      () => expect(getPullRequestComments).toHaveBeenCalledTimes(2),
      { timeout: 8000 },
    );
  });
});
