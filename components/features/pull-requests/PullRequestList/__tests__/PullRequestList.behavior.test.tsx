import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { PullRequest } from "@/lib/types/pull-request.types";
import { getPullRequests } from "@/services/pull-requests.service";

import PullRequestList from "../PullRequestList";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequests: vi.fn(),
}));

const PR = (overrides: Partial<PullRequest> = {}): PullRequest => ({
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
  ...overrides,
});

const renderList = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId="org_1" role="VIEWER">
        <PullRequestList />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("PullRequestList — navigation", () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.mocked(getPullRequests).mockReset();
  });

  it("opens the clicked PR with its repository", async () => {
    vi.mocked(getPullRequests).mockResolvedValue({
      data: [
        PR(),
        PR({ id: "pr_2", repositoryId: "repo_9", title: "Fix login" }),
      ],
    });
    renderList();

    fireEvent.click(
      (await screen.findByText("Fix login")).closest("tr") as HTMLElement,
    );

    expect(getPullRequests).toHaveBeenCalledWith("org_1");
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      "/acme/pull-requests/pr_2?repoId=repo_9",
    );
  });
});
