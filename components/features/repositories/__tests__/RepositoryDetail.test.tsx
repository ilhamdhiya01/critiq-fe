import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type { OrgRepository } from "@/lib/types/repository.types";
import {
  getOrgRepositories,
  getRepoBranches,
  getRepoPulls,
  getRepoScans,
  getScanConfig,
} from "@/services/repositories.service";

import RepositoryDetail from "../RepositoryDetail";

let currentRole: Role = "ADMIN";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/lib/hooks/organisation/useOrgBySlug", () => ({
  useOrgBySlug: () => ({ membership: { role: currentRole } }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
  getScanConfig: vi.fn(),
  getRepoPulls: vi.fn(),
  getRepoScans: vi.fn(),
  getRepoBranches: vi.fn(),
  rescanRepo: vi.fn(),
  updateScanConfig: vi.fn(),
}));

const REPO: OrgRepository = {
  id: "repo_1",
  provider: "GITHUB",
  path: "acme/critiq-core",
  defaultBranch: "main",
  monitoredBranchCount: 1,
  language: "TypeScript",
  openPullCount: 1,
  openCriticalCount: 1,
  lastScanAt: "2026-10-09T03:12:00Z",
};

const PULL = {
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
  criticalCount: 1,
  effectivePolicy: "MANUAL_ONLY",
  createdAt: "2026-10-09T01:00:00Z",
  updatedAt: "2026-10-09T02:00:00Z",
  latestScan: { criticalCount: 1 },
  activeScan: { id: "s9", status: "RUNNING" },
};

const renderDetail = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RepositoryDetail orgId="org_1" repoId="repo_1" />
    </QueryClientProvider>,
  );

// First render in a cold worker can exceed the 5s default under load.
describe("RepositoryDetail", { timeout: 15_000 }, () => {
  beforeEach(() => {
    currentRole = "ADMIN";
    vi.mocked(getOrgRepositories).mockResolvedValue({ data: [REPO] });
    vi.mocked(getScanConfig).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: ["main"],
        policies: [{ branch: "main", policy: "require_both" }],
        missing: [],
        missingCheckStatus: "not_available",
        defaultBranchChangedAt: null,
      },
    });
    vi.mocked(getRepoPulls).mockResolvedValue({
      data: [PULL],
    } as unknown as Awaited<ReturnType<typeof getRepoPulls>>);
    vi.mocked(getRepoScans).mockResolvedValue({
      data: [
        {
          id: "s3",
          status: "RUNNING",
          trigger: "WEBHOOK",
          criticalCount: 0,
          createdAt: "2026-10-09T03:00:00Z",
          finishedAt: null,
          pull: { id: "pr_1", number: "462", title: "Newest" },
        },
        {
          id: "s2",
          status: "FAILED",
          trigger: "RESCAN",
          criticalCount: 1,
          createdAt: "2026-10-08T03:00:00Z",
          finishedAt: "2026-10-08T03:01:00Z",
          pull: { id: "pr_1", number: "461", title: "Older" },
        },
        {
          id: "s1",
          status: "DONE",
          trigger: "WEBHOOK",
          criticalCount: 2,
          createdAt: "2026-10-07T03:00:00Z",
          finishedAt: "2026-10-07T03:01:00Z",
          pull: { id: "pr_1", number: "460", title: "Oldest" },
        },
      ],
    });
    vi.mocked(getRepoBranches).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: ["main"],
        total: 1,
        truncated: false,
      },
    });
  });

  it("shows only the two real stats and no gate, rating or coverage", async () => {
    renderDetail();

    expect(await screen.findByText("critiq-core")).toBeInTheDocument();
    expect(screen.getByText("Critical in open PRs")).toBeInTheDocument();
    expect(screen.getByText("Open pull requests")).toBeInTheDocument();
    for (const text of [
      "Quality rating",
      "Coverage on new code",
      "PASSED",
      "FAILED",
      "Changes requested",
    ]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.getByText("default: main")).toBeInTheDocument();
    expect(screen.getByText(/last scan/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Re-scan open PRs/ }),
    ).toBeVisible();
  });

  it("lists pull requests without gate/status columns and a spinner while scanning", async () => {
    renderDetail();

    const row = (
      await screen.findByText("Rate limiter for public GraphQL gateway")
    ).closest("a") as HTMLElement;
    expect(row).toHaveAttribute(
      "href",
      "/acme/pull-requests/pr_1?repoId=repo_1",
    );
    expect(screen.getByText("Review policy")).toBeInTheDocument();
    expect(screen.queryByText("Quality gate")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(within(row).getByLabelText("Scanning")).toBeInTheDocument();
    expect(within(row).getByText("Manual only")).toBeInTheDocument();
    expect(within(row).getByText("DA")).toBeInTheDocument();
  });

  it("shows scan history newest first with scan-status labels and PR links", async () => {
    renderDetail();

    const history = (await screen.findByText("PR Scan History")).closest(
      "section",
    ) as HTMLElement;
    const items = await within(history).findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Scanning…"),
      expect.stringContaining("Failed"),
      expect.stringContaining("Done"),
    ]);
    expect(within(history).getByText("#461")).toHaveAttribute(
      "href",
      "/acme/pull-requests/pr_1?repoId=repo_1",
    );
  });

  it("hides Re-scan and edit controls from Viewers", async () => {
    currentRole = "VIEWER";
    renderDetail();

    expect(await screen.findByText("critiq-core")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Re-scan open PRs/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("hides elements whose fields/endpoints the BE does not ship yet", async () => {
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        {
          id: "repo_1",
          provider: "GITHUB",
          path: "acme/critiq-core",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
      ],
    });
    vi.mocked(getRepoScans).mockRejectedValue(
      new AxiosError("Not Found", "ERR", undefined, undefined, {
        status: 404,
        data: {},
      } as AxiosResponse),
    );
    renderDetail();

    expect(await screen.findByText("critiq-core")).toBeInTheDocument();
    expect(screen.queryByText("Critical in open PRs")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/last scan|not scanned yet/),
    ).not.toBeInTheDocument();
    await screen.findByText("Rate limiter for public GraphQL gateway");
    expect(screen.queryByText("PR Scan History")).not.toBeInTheDocument();
  });
});
