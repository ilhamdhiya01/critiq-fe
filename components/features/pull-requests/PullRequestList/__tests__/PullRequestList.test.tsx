import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PullRequest } from "@/lib/types/pull-request.types";
import { getPullRequests } from "@/services/pull-requests.service";

import PullRequestList from "../PullRequestList";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequests: vi.fn(),
}));

const BASE_PR: PullRequest = {
  id: "pr_1",
  repositoryId: "repo_1",
  repositoryPath: "acme/critiq-core",
  provider: "GITHUB",
  externalId: "461",
  title: "Rate limiter for public GraphQL gateway",
  authorUsername: "danherrera",
  sourceBranch: "feat/rate-limit",
  targetBranch: "main",
  state: "OPEN",
  criticalCount: 0,
  effectivePolicy: "ALLOW_AI",
  createdAt: "2026-10-09T01:00:00Z",
  updatedAt: "2026-10-09T02:00:00Z",
  latestScan: null,
};

const renderList = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PullRequestList orgId="org_1" />
    </QueryClientProvider>,
  );

const scanWith = (criticalCount: number) =>
  ({ criticalCount }) as unknown as PullRequest["latestScan"];

describe("PullRequestList — critical column", () => {
  beforeEach(() => {
    vi.mocked(getPullRequests).mockReset();
  });

  it("shows the latest scan's critical count and — when never scanned", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [
        {
          ...BASE_PR,
          id: "pr_scanned",
          title: "Scanned PR",
          latestScan: scanWith(3),
        },
        { ...BASE_PR, id: "pr_new", title: "Unscanned PR", latestScan: null },
      ],
    });
    renderList();

    expect(await screen.findByText("Critical")).toBeInTheDocument();
    const scanned = screen.getByText("Scanned PR").closest("tr") as HTMLElement;
    expect(within(scanned).getByText("3")).toHaveClass("text-danger-light");
    const unscanned = screen
      .getByText("Unscanned PR")
      .closest("tr") as HTMLElement;
    expect(within(unscanned).getByText("—")).toBeInTheDocument();
  });

  it("ignores a qualityGate still sent by an older BE", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [
        {
          ...BASE_PR,
          latestScan: scanWith(0),
          qualityGate: { status: "failed", reasons: [], ci: "failure" },
        } as PullRequest,
      ],
    });
    renderList();

    await screen.findByText("Rate limiter for public GraphQL gateway");
    for (const text of ["Quality gate", "Lolos", "Gagal", "Menunggu"]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/CI:/)).not.toBeInTheDocument();
  });

  it("shows the latest review decision, dimmed once outdated", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [
        {
          ...BASE_PR,
          id: "pr_approved",
          title: "Approved PR",
          latestReview: { decision: "approve", outdated: false },
        },
        {
          ...BASE_PR,
          id: "pr_changes",
          title: "Changes PR",
          latestReview: { decision: "request_changes", outdated: true },
        },
      ] as unknown as PullRequest[],
    });
    renderList();

    const approved = (await screen.findByText("Approved PR")).closest(
      "tr",
    ) as HTMLElement;
    expect(within(approved).getByText("Approved")).not.toHaveClass(
      "opacity-50",
    );
    const changes = screen.getByText("Changes PR").closest("tr") as HTMLElement;
    expect(within(changes).getByText("Changes requested")).toHaveClass(
      "opacity-50",
    );
  });
});
