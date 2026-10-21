import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { retryCommentSync } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useRetryCommentSync } from "../useRetryCommentSync";

vi.mock("@/services/pull-requests.service", () => ({
  retryCommentSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRetryCommentSync(...PR), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(retryCommentSync)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

describe("useRetryCommentSync", () => {
  afterEach(() => vi.clearAllMocks());

  it("refetches the comments after retrying", async () => {
    vi.mocked(retryCommentSync).mockResolvedValue({ data: {} } as never);
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRetryCommentSync("c_1"));

    await waitFor(() =>
      expect(invalidatedKeys()).toEqual([pullRequestKeys.comments(...PR)]),
    );
    expect(retryCommentSync).toHaveBeenCalledWith(...PR, "c_1");
  });

  it.each(["already_synced", "sync_in_progress"])(
    "just refreshes when the comment is %s",
    async (code) => {
      rejectWith(409, { message: code });
      const { result, invalidatedKeys } = setup();

      act(() => result.current.handleRetryCommentSync("c_1"));

      await waitFor(() =>
        expect(invalidatedKeys()).toEqual([pullRequestKeys.comments(...PR)]),
      );
      expect(toast.error).not.toHaveBeenCalled();
    },
  );

  it("toasts other failures", async () => {
    rejectWith(502, { message: "Provider down" });
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRetryCommentSync("c_1"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Provider down"),
    );
    expect(invalidatedKeys()).toHaveLength(0);
    expect(result.current.isRetryingSync).toBe(false);
  });
});
