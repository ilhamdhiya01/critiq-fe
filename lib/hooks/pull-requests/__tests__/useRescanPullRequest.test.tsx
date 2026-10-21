import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { regeneratePullRequestSummary } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useRegeneratePullRequestSummary } from "../useRescanPullRequest";

vi.mock("@/services/pull-requests.service", () => ({
  regeneratePullRequestSummary: vi.fn(),
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
  const { result } = renderHook(() => useRegeneratePullRequestSummary(...PR), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useRegeneratePullRequestSummary", () => {
  afterEach(() => vi.clearAllMocks());

  it("refetches the summary and the detail", async () => {
    vi.mocked(regeneratePullRequestSummary).mockResolvedValue({
      data: {},
    } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleRegenerate());

    expect(regeneratePullRequestSummary).toHaveBeenCalledWith(...PR);
    expect(invalidatedKeys()).toEqual([
      pullRequestKeys.summary(...PR),
      pullRequestKeys.detail(...PR),
    ]);
  });

  it("refreshes the summary when the AI setup changed (412)", async () => {
    vi.mocked(regeneratePullRequestSummary).mockRejectedValue(httpError(412));
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleRegenerate()).rejects.toThrow(),
    );

    expect(invalidatedKeys()).toEqual([pullRequestKeys.summary(...PR)]);
    expect(toast.info).toHaveBeenCalledWith(
      "AI setup changed — the summary has been refreshed.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts other failures", async () => {
    vi.mocked(regeneratePullRequestSummary).mockRejectedValue(
      httpError(500, "Server error"),
    );
    const { result, invalidatedKeys } = setup();

    await act(() =>
      expect(result.current.handleRegenerate()).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith("Server error");
    expect(invalidatedKeys()).toHaveLength(0);
  });
});
