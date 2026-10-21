import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type { ApiResponse } from "@/lib/types/api.types";
import type { PullRequestDetail } from "@/lib/types/pull-request.types";
import { retryReviewSync } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useRetryReviewSync } from "../useRetryReviewSync";

vi.mock("@/services/pull-requests.service", () => ({
  retryReviewSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;

const failed = { status: "failed", error: "provider_unreachable" };

const DETAIL = {
  data: {
    id: "pr_1",
    latestReview: { id: "r_1", sync: failed },
    reviewers: [
      { reviewId: "r_1", sync: failed },
      { reviewId: "r_2", sync: failed },
    ],
  },
} as unknown as ApiResponse<PullRequestDetail>;

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(pullRequestKeys.detail(...PR), DETAIL);
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRetryReviewSync(...PR), { wrapper });
  const detail = () =>
    client.getQueryData<ApiResponse<PullRequestDetail>>(
      pullRequestKeys.detail(...PR),
    )?.data;
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, detail, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(retryReviewSync)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

describe("useRetryReviewSync", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the row as syncing while it retries, then updates the detail", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(retryReviewSync).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as never,
    );
    const { result, detail, invalidatedKeys } = setup();

    act(() => result.current.handleRetrySync("r_1"));

    await waitFor(() => expect(result.current.retryingReviewId).toBe("r_1"));
    expect(result.current.isRetrying).toBe(true);
    expect(retryReviewSync).toHaveBeenCalledWith(...PR, "r_1");

    const retried = { id: "r_1", sync: { status: "pending", error: null } };
    await act(async () => resolve({ data: retried }));

    await waitFor(() =>
      expect(result.current.retryingReviewId).toBeUndefined(),
    );
    expect(detail()?.latestReview).toEqual(retried);
    expect(detail()?.reviewers).toEqual([
      { reviewId: "r_1", sync: { status: "pending", error: null } },
      { reviewId: "r_2", sync: failed },
    ]);
    expect(invalidatedKeys()).toEqual([pullRequestKeys.reviews(...PR)]);
  });

  it("leaves the latest review alone when an older one was retried", async () => {
    const retried = { id: "r_2", sync: { status: "synced", error: null } };
    vi.mocked(retryReviewSync).mockResolvedValue({ data: retried } as never);
    const { result, detail } = setup();

    act(() => result.current.handleRetrySync("r_2"));

    await waitFor(() =>
      expect(detail()?.reviewers?.[1].sync.status).toBe("synced"),
    );
    expect(detail()?.latestReview).toEqual(DETAIL.data.latestReview);
  });

  it("just refreshes when the review synced in the meantime", async () => {
    rejectWith(409, { message: "already_synced" });
    const { result, invalidatedKeys } = setup();

    act(() => result.current.handleRetrySync("r_1"));

    await waitFor(() =>
      expect(invalidatedKeys()).toEqual([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.reviews(...PR),
      ]),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts other failures", async () => {
    rejectWith(500, {}, "Network Error");
    const { result } = setup();

    act(() => result.current.handleRetrySync("r_1"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Network Error"),
    );
  });
});
