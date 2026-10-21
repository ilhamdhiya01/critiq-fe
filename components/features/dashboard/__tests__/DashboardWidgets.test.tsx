import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { DashboardSummary } from "@/lib/types/dashboard.types";
import {
  getDashboardCriticalIssues,
  getDashboardRecentReviews,
  getDashboardSummary,
} from "@/services/dashboard.service";
import { getOrgRepositories } from "@/services/repositories.service";

import CriticalIssues from "../CriticalIssues";
import RecentActivity from "../RecentActivity";
import ReviewStats from "../ReviewStats";
import SummaryCards from "../SummaryCards";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/dashboard.service", () => ({
  getDashboardSummary: vi.fn(),
  getDashboardCriticalIssues: vi.fn(),
  getDashboardRecentReviews: vi.fn(),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

const SUMMARY: DashboardSummary = {
  openCritical: { count: 7, pullCount: 2 },
  repositories: { count: 6, addedThisMonth: 1 },
  reviewTurnaround: { avgHours: 4.6, previousAvgHours: 5.2333 },
  reviews30d: {
    total: 442,
    aiAssisted: 284,
    manual: 158,
    avgApproveHours: { aiAssisted: 3.2, manual: 9.6 },
  },
};

const PULL = {
  id: "pr_1",
  number: "482",
  title: "Rate limiter",
  repoId: "repo_gl",
  repoPath: "acme/payments-api",
};

const renderWidget = (widget: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId="org_1">{widget}</ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("Dashboard widgets", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(getDashboardSummary).mockReset();
    vi.mocked(getDashboardCriticalIssues).mockReset();
    vi.mocked(getDashboardRecentReviews).mockReset();
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        {
          id: "repo_gl",
          provider: "GITLAB",
          path: "acme/payments-api",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
      ],
    });
  });

  describe("SummaryCards", () => {
    it("shows the three KPIs with their hints", async () => {
      vi.mocked(getDashboardSummary).mockResolvedValue({ data: SUMMARY });
      renderWidget(<SummaryCards />);

      expect(await screen.findByText("4.6 h")).toBeInTheDocument();
      expect(screen.getByText("↓ 38 min")).toHaveClass("text-success-light");
      expect(screen.getByText("across 2 open PRs")).toBeInTheDocument();
      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(screen.queryByText(/pass rate/i)).not.toBeInTheDocument();
    });

    it("shows — without a trend and hides +0 this month", async () => {
      vi.mocked(getDashboardSummary).mockResolvedValue({
        data: {
          ...SUMMARY,
          repositories: { count: 6, addedThisMonth: 0 },
          reviewTurnaround: { avgHours: null, previousAvgHours: 2 },
        },
      });
      renderWidget(<SummaryCards />);

      expect(await screen.findByText("—")).toBeInTheDocument();
      expect(screen.queryByText(/vs last week/)).not.toBeInTheDocument();
      expect(screen.queryByText(/this month/)).not.toBeInTheDocument();
    });
  });

  describe("CriticalIssues", () => {
    it("shows an empty state", async () => {
      vi.mocked(getDashboardCriticalIssues).mockResolvedValue({ data: [] });
      renderWidget(<CriticalIssues />);

      expect(
        await screen.findByText("No critical issues in open PRs"),
      ).toBeInTheDocument();
      expect(screen.queryByText("View all")).not.toBeInTheDocument();
    });

    it("links each issue to its PR and loads 50 in View all", async () => {
      vi.mocked(getDashboardCriticalIssues).mockResolvedValue({
        data: [
          {
            findingId: "f1",
            title: "Hard-coded JWT fallback secret",
            source: "STATIC",
            filePath: "src/config.ts",
            lineStart: 12,
            firstSeenAt: new Date().toISOString(),
            pull: PULL,
          },
        ],
      });
      renderWidget(<CriticalIssues />);

      const title = await screen.findByText("Hard-coded JWT fallback secret");
      expect(title.closest("a")).toHaveAttribute(
        "href",
        "/acme/pull-requests/pr_1?repoId=repo_gl",
      );
      expect(await screen.findByText("!482 · payments-api")).toBeVisible();
      expect(getDashboardCriticalIssues).toHaveBeenCalledWith("org_1", 5);

      fireEvent.click(screen.getByRole("button", { name: "View all" }));
      await waitFor(() =>
        expect(getDashboardCriticalIssues).toHaveBeenCalledWith("org_1", 50),
      );
    });
  });

  describe("RecentActivity", () => {
    it("shows an empty state", async () => {
      vi.mocked(getDashboardRecentReviews).mockResolvedValue({ data: [] });
      renderWidget(<RecentActivity />);

      expect(await screen.findByText("No reviews yet")).toBeInTheDocument();
    });

    it("labels deleted reviewers and the review mode", async () => {
      vi.mocked(getDashboardRecentReviews).mockResolvedValue({
        data: [
          {
            id: "r1",
            decision: "request_changes",
            aiAssisted: false,
            sync: { status: "synced" },
            reviewer: null,
            pull: PULL,
            createdAt: new Date().toISOString(),
          },
          {
            id: "r2",
            decision: "approve",
            aiAssisted: true,
            sync: { status: "synced" },
            reviewer: { id: "u1", name: "Priya Natarajan", avatarUrl: null },
            pull: PULL,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      renderWidget(<RecentActivity />);

      expect(await screen.findByText("Deleted user")).toBeInTheDocument();
      expect(screen.getByText("Priya Natarajan")).toBeInTheDocument();
      expect(screen.getByText("Changes requested")).toHaveClass(
        "text-warning-light",
      );
      expect(screen.getByText("AI-Assisted")).toBeInTheDocument();
      expect(screen.getByText("Manual")).toBeInTheDocument();
    });
  });

  describe("ReviewStats", () => {
    it("splits AI-assisted vs manual", async () => {
      vi.mocked(getDashboardSummary).mockResolvedValue({ data: SUMMARY });
      renderWidget(<ReviewStats />);

      expect(await screen.findByText("442")).toBeInTheDocument();
      expect(screen.getByText("AI-assisted · 284 (64%)")).toBeInTheDocument();
      expect(screen.getByText("Manual · 158")).toBeInTheDocument();
      expect(screen.getByText("3.2 h")).toBeInTheDocument();
    });

    it("shows an empty bar when there are no reviews", async () => {
      vi.mocked(getDashboardSummary).mockResolvedValue({
        data: {
          ...SUMMARY,
          reviews30d: {
            total: 0,
            aiAssisted: 0,
            manual: 0,
            avgApproveHours: { aiAssisted: null, manual: null },
          },
        },
      });
      renderWidget(<ReviewStats />);

      expect(
        await screen.findByRole("img", { name: "No reviews yet" }),
      ).toBeInTheDocument();
      expect(screen.getByText("No reviews yet")).toBeInTheDocument();
      expect(screen.getAllByText("—")).toHaveLength(2);
    });
  });
});
