import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type {
  PullRequestDetail,
  PullRequestReview,
} from "@/lib/types/pull-request.types";
import { retryReviewSync } from "@/services/pull-requests.service";

import PullRequestDetailHeader from "../PullRequestDetailHeader";

vi.mock("@/services/pull-requests.service", () => ({
  retryReviewSync: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const DETAIL: PullRequestDetail = {
  id: "pr_1",
  repositoryId: "repo_1",
  repositoryPath: "acme/payments-api",
  provider: "GITLAB",
  externalId: "45",
  title: "Rate limiter",
  authorUsername: "maya",
  sourceBranch: "feat/rate-limit",
  targetBranch: "main",
  state: "OPEN",
  criticalCount: 0,
  effectivePolicy: "ALLOW_AI",
  createdAt: "2026-10-09T01:00:00Z",
  updatedAt: "2026-10-09T02:00:00Z",
  latestScan: null,
  headSha: "sha_head",
  reviewers: [
    {
      reviewId: "rev_1",
      reviewer: { id: "u1", name: "Ilham", avatarUrl: null },
      decision: "approve",
      headSha: "sha_head",
      outdated: false,
      aiAssisted: false,
      sync: { status: "failed", error: "provider_unreachable" },
      createdAt: "2026-10-12T03:00:00Z",
    },
  ],
};

const renderHeader = (role?: Role) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PullRequestDetailHeader detail={DETAIL} orgId="org_1" role={role} />
    </QueryClientProvider>,
  );

describe("PullRequestDetailHeader", () => {
  beforeEach(() => {
    vi.mocked(retryReviewSync).mockReset();
    vi.mocked(retryReviewSync).mockResolvedValue({
      data: { id: "rev_1" } as PullRequestReview,
    });
  });

  it.each<Role>(["ADMIN", "REVIEWER"])(
    "lets a %s resend a failed review sync for this PR",
    async (role) => {
      renderHeader(role);

      fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));

      await waitFor(() =>
        expect(retryReviewSync).toHaveBeenCalledWith(
          "org_1",
          "repo_1",
          "pr_1",
          "rev_1",
        ),
      );
    },
  );

  it.each<[string, Role | undefined]>([
    ["VIEWER", "VIEWER"],
    ["missing role", undefined],
  ])("offers no retry for %s", (_, role) => {
    renderHeader(role);

    expect(screen.getByText(/Couldn't reach GitLab/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry sync" }),
    ).not.toBeInTheDocument();
  });
});
