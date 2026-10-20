import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  PullRequestReview,
  PullRequestReviewer,
} from "@/lib/types/pull-request.types";
import { retryReviewSync } from "@/services/pull-requests.service";

import ReviewersSummary from "../ReviewersSummary";

vi.mock("@/services/pull-requests.service", () => ({
  retryReviewSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const entry = (
  name: string | null,
  overrides: Partial<PullRequestReviewer> = {},
): PullRequestReviewer => ({
  reviewId: `rev_${name ?? "deleted"}`,
  reviewer: name ? { id: `u_${name}`, name, avatarUrl: null } : null,
  decision: "approve",
  headSha: "sha_head",
  outdated: false,
  aiAssisted: false,
  sync: { status: "synced", error: null },
  createdAt: "2026-10-12T03:00:00Z",
  ...overrides,
});

const renderSummary = (reviewers: PullRequestReviewer[], canRetry = true) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReviewersSummary
        orgId="org_1"
        repoId="repo_1"
        pullId="pr_1"
        reviewers={reviewers}
        providerName="GitHub"
        canRetry={canRetry}
      />
    </QueryClientProvider>,
  );

describe("ReviewersSummary", () => {
  beforeEach(() => {
    vi.mocked(retryReviewSync).mockReset();
    vi.mocked(retryReviewSync).mockResolvedValue({
      data: {
        id: "rev_Maya",
        sync: { status: "pending", error: null, syncedAt: null },
      } as PullRequestReview,
    });
  });

  it("counts current decisions, stacks their avatars and notes outdated ones", () => {
    renderSummary([
      entry("Ilham"),
      entry("Ana"),
      entry("Maya", { decision: "request_changes" }),
      entry("Tom", { outdated: true }),
    ]);

    expect(screen.getByText("2 approvals")).toBeInTheDocument();
    expect(screen.getByText("1 changes requested")).toBeInTheDocument();
    expect(screen.getByText("1 outdated")).toHaveAttribute(
      "title",
      "Reviewed an older commit",
    );
    // Outdated reviewers get no avatar.
    expect(
      screen.getAllByRole("img").map((avatar) => avatar.getAttribute("title")),
    ).toEqual([
      "Ilham · Approved",
      "Ana · Approved",
      "Maya · Changes requested",
    ]);
    // No per-reviewer list any more.
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("uses the singular and drops a zero count", () => {
    renderSummary([entry("Ilham")]);

    expect(screen.getByText("1 approval")).toBeInTheDocument();
    expect(screen.queryByText(/changes requested/)).not.toBeInTheDocument();
    expect(screen.queryByText(/outdated/)).not.toBeInTheDocument();
  });

  it("collapses extra avatars into +N", () => {
    renderSummary(
      ["A", "B", "C", "D", "E", "F", "G"].map((name) => entry(name)),
    );

    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("names a deleted account in the avatar tooltip", () => {
    renderSummary([entry(null, { decision: "request_changes" })]);

    expect(
      screen.getByRole("img", { name: "Deleted user · Changes requested" }),
    ).toBeInTheDocument();
  });

  it("handles only-outdated and empty states", () => {
    const { unmount } = renderSummary([entry("Tom", { outdated: true })]);
    expect(
      screen.getByText("No reviews on the latest commit"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 outdated")).toBeInTheDocument();
    unmount();

    renderSummary([]);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
  });

  it("keeps Retry for a decision that failed to sync", async () => {
    renderSummary([
      entry("Ilham"),
      entry("Maya", {
        decision: "request_changes",
        sync: { status: "failed", error: "insufficient_permission" },
      }),
    ]);

    expect(screen.getByText("Maya:")).toBeInTheDocument();
    expect(
      screen.getByText(/Critiq doesn't have permission to review on GitHub/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));

    await waitFor(() =>
      expect(retryReviewSync).toHaveBeenCalledWith(
        "org_1",
        "repo_1",
        "pr_1",
        "rev_Maya",
      ),
    );
  });

  it("offers no retry to Viewers", () => {
    renderSummary(
      [entry("Maya", { sync: { status: "failed", error: "unknown" } })],
      false,
    );

    expect(screen.getByText(/Couldn't reach GitHub — retry\./)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Retry sync" }),
    ).not.toBeInTheDocument();
  });
});
