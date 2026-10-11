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

describe("PullRequestList — quality gate badge", () => {
  beforeEach(() => {
    vi.mocked(getPullRequests).mockReset();
  });

  it("shows Lolos, Gagal, and Menunggu badges from qualityGate.status", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [
        {
          ...BASE_PR,
          id: "pr_passed",
          title: "Passed PR",
          qualityGate: {
            status: "passed",
            reasons: [],
            ci: "success",
            uncheckedTiers: [],
          },
        },
        {
          ...BASE_PR,
          id: "pr_failed",
          title: "Failed PR",
          qualityGate: {
            status: "failed",
            reasons: ["critical_findings"],
            ci: "success",
            uncheckedTiers: [],
          },
        },
        {
          ...BASE_PR,
          id: "pr_pending",
          title: "Pending PR",
          qualityGate: {
            status: "pending",
            reasons: ["scan_running"],
            ci: "pending",
            uncheckedTiers: [],
          },
        },
      ],
    });
    renderList();

    expect(await screen.findByText("Lolos")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByText("Menunggu")).toBeInTheDocument();

    const row = screen.getByText("Passed PR").closest("tr") as HTMLElement;
    expect(within(row).getByText("Lolos")).toBeInTheDocument();
    expect(within(row).queryByText("Critical")).not.toBeInTheDocument();
  });

  it("falls back to the critical count when qualityGate is missing", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [{ ...BASE_PR, criticalCount: 2 }],
    });
    renderList();

    const row = (
      await screen.findByText("Rate limiter for public GraphQL gateway")
    ).closest("tr") as HTMLElement;
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(within(row).getByText(/Critical/)).toBeInTheDocument();
    expect(within(row).queryByText("Lolos")).not.toBeInTheDocument();
    expect(within(row).queryByText("Gagal")).not.toBeInTheDocument();
    expect(within(row).queryByText("Menunggu")).not.toBeInTheDocument();
  });
});
