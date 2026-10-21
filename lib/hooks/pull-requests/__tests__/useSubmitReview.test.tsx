import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REVIEW_ALREADY_MESSAGE,
  REVIEW_ERROR_MESSAGE,
} from "@/const/pull-request.constant";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  PullRequestDetail,
  PullRequestReview,
} from "@/lib/types/pull-request.types";
import { submitPullRequestReview } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useSubmitReview } from "../useSubmitReview";

vi.mock("@/services/pull-requests.service", () => ({
  submitPullRequestReview: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;
const APPROVE = { decision: "approve" } as never;

const ME = { id: "u_me", name: "Me", avatarUrl: null };
const OTHER = { id: "u_other", name: "Other", avatarUrl: null };

const REVIEW = {
  id: "r_new",
  decision: "approve",
  reviewer: ME,
  headSha: "abc",
  outdated: false,
  aiAssisted: true,
  sync: { status: "pending", error: null },
  createdAt: "2026-10-20T00:00:00Z",
} as unknown as PullRequestReview;

const OLD_REVIEW = { id: "r_old" } as PullRequestReview;

const setup = (seed = true) => {
  const client = new QueryClient();
  if (seed) {
    client.setQueryData(pullRequestKeys.detail(...PR), {
      data: {
        id: "pr_1",
        latestReview: null,
        reviewers: [
          { reviewId: "r_mine_old", reviewer: ME },
          { reviewId: "r_other", reviewer: OTHER },
        ],
      },
    });
    client.setQueryData(pullRequestKeys.reviews(...PR), {
      data: [OLD_REVIEW],
    });
  }
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useSubmitReview(...PR), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(submitPullRequestReview)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

const submit = (result: ReturnType<typeof setup>["result"]) =>
  act(() =>
    expect(result.current.handleSubmitReview(APPROVE)).rejects.toThrow(),
  );

describe("useSubmitReview", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows my decision right away in the detail and the history", async () => {
    vi.mocked(submitPullRequestReview).mockResolvedValue({ data: REVIEW });
    const { client, result, invalidatedKeys } = setup();

    await act(() => result.current.handleSubmitReview(APPROVE));

    expect(submitPullRequestReview).toHaveBeenCalledWith(...PR, APPROVE);
    const detail = client.getQueryData<ApiResponse<PullRequestDetail>>(
      pullRequestKeys.detail(...PR),
    )?.data;
    expect(detail?.latestReview).toEqual(REVIEW);
    // My previous entry is replaced and the new one goes on top.
    expect(detail?.reviewers?.map((entry) => entry.reviewId)).toEqual([
      "r_new",
      "r_other",
    ]);
    expect(detail?.reviewers?.[0]).toMatchObject({
      reviewer: ME,
      aiAssisted: true,
      sync: { status: "pending", error: null },
    });
    expect(
      client.getQueryData<ApiResponse<PullRequestReview[]>>(
        pullRequestKeys.reviews(...PR),
      )?.data,
    ).toEqual([REVIEW, OLD_REVIEW]);
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.reviews(...PR),
        pullRequestKeys.list("org_1"),
        repositoryKeys.pulls("org_1", "repo_1"),
      ]),
    );
    expect(toast.success).toHaveBeenCalledWith("Approved");
  });

  it("does not create cache entries that were never loaded", async () => {
    vi.mocked(submitPullRequestReview).mockResolvedValue({ data: REVIEW });
    const { client, result } = setup(false);

    await act(() => result.current.handleSubmitReview(APPROVE));

    expect(client.getQueryData(pullRequestKeys.detail(...PR))).toBeUndefined();
    expect(client.getQueryData(pullRequestKeys.reviews(...PR))).toBeUndefined();
  });

  it("refetches the history when the decision was already recorded", async () => {
    rejectWith(409, { message: "already_reviewed" });
    const { result, invalidatedKeys } = setup();

    await submit(result);

    expect(result.current.submitError).toBe(REVIEW_ALREADY_MESSAGE.approve);
    expect(invalidatedKeys()).toEqual([pullRequestKeys.reviews(...PR)]);
  });

  it("reloads detail, diff and summary when the head moved on", async () => {
    rejectWith(409, { message: "head_changed" });
    const { result, invalidatedKeys } = setup();

    await submit(result);

    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.diff(...PR),
        pullRequestKeys.summary(...PR),
      ]),
    );
    expect(result.current.submitError).toBe(REVIEW_ERROR_MESSAGE.head_changed);
  });

  it.each(["pull_not_open", "scan_required", "ai_analysis_required"])(
    "reloads only the detail for %s",
    async (code) => {
      rejectWith(422, { message: code });
      const { result, invalidatedKeys } = setup();

      await submit(result);

      expect(invalidatedKeys()).toEqual([pullRequestKeys.detail(...PR)]);
      expect(result.current.submitError).toBe(REVIEW_ERROR_MESSAGE[code]);
    },
  );

  it("reports 403 as forbidden", async () => {
    rejectWith(403, { message: "role_too_low" });
    const { result } = setup();

    await submit(result);

    expect(result.current.submitError).toBe(REVIEW_ERROR_MESSAGE.forbidden);
  });

  it("falls back to the BE message, then the error message", async () => {
    rejectWith(400, { message: "Odd request" });
    const { result } = setup();

    await submit(result);
    expect(result.current.submitError).toBe("Odd request");

    rejectWith(500, {}, "Network Error");
    await submit(result);
    expect(result.current.submitError).toBe("Network Error");

    act(() => result.current.clearSubmitError());
    expect(result.current.submitError).toBeNull();
  });
});
