import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INTEGRATION_FORBIDDEN_MESSAGE } from "@/const/integration.constant";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import { disconnectGitlab } from "@/services/integrations.service";

import { integrationKeys } from "../queryKeys";
import { useDisconnectGitlab } from "../useDisconnectGitlab";

vi.mock("@/services/integrations.service", () => ({
  disconnectGitlab: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const RESYNC_KEYS = [
  integrationKeys.list("org_1"),
  integrationKeys.candidates("org_1", "gitlab"),
  repositoryKeys.org("org_1"),
];

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDisconnectGitlab("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useDisconnectGitlab", () => {
  afterEach(() => vi.clearAllMocks());

  it("resyncs the integration card and GitLab repos", async () => {
    vi.mocked(disconnectGitlab).mockResolvedValue({ data: null });
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleDisconnectGitlab());

    expect(invalidatedKeys()).toEqual(expect.arrayContaining(RESYNC_KEYS));
  });

  it("resyncs without an error when already disconnected (404)", async () => {
    vi.mocked(disconnectGitlab).mockRejectedValue(httpError(404));
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleDisconnectGitlab()).rejects.toThrow(),
    );

    expect(invalidatedKeys()).toEqual(expect.arrayContaining(RESYNC_KEYS));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts other failures", async () => {
    vi.mocked(disconnectGitlab).mockRejectedValue(httpError(403));
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleDisconnectGitlab()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(INTEGRATION_FORBIDDEN_MESSAGE);
    expect(invalidatedKeys()).toHaveLength(0);
  });
});
