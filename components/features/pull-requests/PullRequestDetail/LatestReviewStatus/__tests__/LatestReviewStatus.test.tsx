import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PullRequestReview } from "@/lib/types/pull-request.types";
import { retryReviewSync } from "@/services/pull-requests.service";

import LatestReviewStatus from "../LatestReviewStatus";

vi.mock("@/services/pull-requests.service", () => ({
  retryReviewSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const REVIEW: PullRequestReview = {
  id: "rev_1",
  decision: "approve",
  body: null,
  headSha: "sha_head",
  reviewer: { id: "u1", name: "Ilham", avatarUrl: null },
  reviewerRole: "admin",
  effectivePolicy: "allow_ai",
  manualConfirmation: false,
  outdated: false,
  sync: { status: "synced", error: null, syncedAt: "2026-10-12T03:01:00Z" },
  createdAt: "2026-10-12T03:00:00Z",
};

const renderStatus = (review: Partial<PullRequestReview>, canRetry = true) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LatestReviewStatus
        orgId="org_1"
        repoId="repo_1"
        pullId="pr_1"
        review={{ ...REVIEW, ...review }}
        providerName="GitHub"
        canRetry={canRetry}
      />
    </QueryClientProvider>,
  );

describe("LatestReviewStatus", () => {
  beforeEach(() => {
    vi.mocked(retryReviewSync).mockReset();
    vi.mocked(retryReviewSync).mockResolvedValue({
      data: {
        ...REVIEW,
        sync: { status: "pending", error: null, syncedAt: null },
      },
    });
  });

  it("names the reviewer and shows a synced review", () => {
    renderStatus({});

    expect(screen.getByText(/Approved by Ilham/)).toBeInTheDocument();
    expect(screen.getByText("Synced")).toBeInTheDocument();
  });

  it("labels a review made before newer commits as outdated", () => {
    renderStatus({ decision: "request_changes", outdated: true });

    expect(screen.getByText(/Changes requested by Ilham/)).toBeInTheDocument();
    expect(
      screen.getByText("Outdated — new commits since this review"),
    ).toBeInTheDocument();
  });

  it("shows syncing while the provider call is pending", () => {
    renderStatus({ sync: { status: "pending", error: null, syncedAt: null } });

    expect(screen.getByText("Syncing to GitHub…")).toBeInTheDocument();
  });

  it("explains a failed sync and retries it", async () => {
    renderStatus({
      sync: {
        status: "failed",
        error: "insufficient_permission",
        syncedAt: null,
      },
    });

    expect(
      screen.getByText(/Critiq doesn't have permission to review on GitHub/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));

    await waitFor(() =>
      expect(retryReviewSync).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        "rev_1",
      ),
    );
  });

  it("offers no retry to Viewers", () => {
    renderStatus(
      { sync: { status: "failed", error: "unknown", syncedAt: null } },
      false,
    );

    expect(screen.getByText("Couldn't reach GitHub — retry.")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Retry sync" }),
    ).not.toBeInTheDocument();
  });
});
