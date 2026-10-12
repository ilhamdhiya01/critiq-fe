import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type {
  PullRequestState,
  PullRequestSummary,
} from "@/lib/types/pull-request.types";
import {
  regeneratePullRequestSummary,
  scanPullRequest,
} from "@/services/pull-requests.service";

import AiSummaryCard from "../AiSummaryCard";

vi.mock("@/services/pull-requests.service", () => ({
  regeneratePullRequestSummary: vi.fn(),
  scanPullRequest: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const STALE_SUMMARY: PullRequestSummary = {
  scanId: "scan_1",
  aiStatus: "not_configured",
  summaryMd: null,
  riskLevel: null,
  provider: null,
  model: null,
  generatedAt: null,
  cached: false,
  filesOmitted: [],
  tokens: null,
  error: {
    code: "not_configured",
    hint: "One is configured now — an Admin or Reviewer can regenerate to run the AI review.",
    stale: true,
  },
};

const renderCard = (
  summary: PullRequestSummary,
  role: Role,
  {
    prState = "OPEN",
    hasScan = true,
  }: { prState?: PullRequestState; hasScan?: boolean } = {},
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AiSummaryCard
        orgId="org_1"
        repoId="repo_1"
        id="pr_1"
        summary={summary}
        criticalCount={0}
        suggestionCount={0}
        filesChanged={3}
        additions={10}
        deletions={2}
        settingsHref="/acme/settings"
        role={role}
        prState={prState}
        hasScan={hasScan}
      />
    </QueryClientProvider>,
  );

describe("AiSummaryCard — stale AI status", () => {
  beforeEach(() => {
    vi.mocked(regeneratePullRequestSummary).mockReset();
    vi.mocked(regeneratePullRequestSummary).mockResolvedValue({ data: null });
  });

  it("shows Run AI review (and no Open Settings or header Regenerate) for a Reviewer", () => {
    renderCard(STALE_SUMMARY, "REVIEWER");

    expect(
      screen.getByText("AI provider is configured now"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not run")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run AI review" })).toBeVisible();
    expect(screen.queryByText("Open Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Regenerate")).not.toBeInTheDocument();
  });

  it("shows no action buttons for a Viewer", () => {
    renderCard(STALE_SUMMARY, "VIEWER");

    expect(
      screen.getByText("Ask an Admin or Reviewer to run the AI review."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Open Settings")).not.toBeInTheDocument();
  });

  it("hides the header Regenerate when AI is not configured (not stale)", () => {
    renderCard(
      {
        ...STALE_SUMMARY,
        error: { code: "not_configured", hint: "x", stale: false },
      },
      "ADMIN",
    );

    expect(screen.getByText("No AI provider configured")).toBeInTheDocument();
    expect(screen.queryByText("Regenerate")).not.toBeInTheDocument();
  });

  it("calls regenerate exactly once when Run AI review is clicked", async () => {
    renderCard(STALE_SUMMARY, "ADMIN");

    fireEvent.click(screen.getByRole("button", { name: "Run AI review" }));

    await waitFor(() =>
      expect(regeneratePullRequestSummary).toHaveBeenCalledTimes(1),
    );
    expect(regeneratePullRequestSummary).toHaveBeenCalledWith(
      "org_1",
      "repo_1",
      "pr_1",
    );
  });
});

const NO_SCAN_SUMMARY: PullRequestSummary = {
  ...STALE_SUMMARY,
  scanId: null,
  aiStatus: null,
  error: {
    code: "no_scan",
    hint: "This pull request has not been scanned yet.",
    stale: false,
  },
};

describe("AiSummaryCard — not scanned yet", () => {
  beforeEach(() => {
    vi.mocked(scanPullRequest).mockReset();
    vi.mocked(scanPullRequest).mockResolvedValue({ data: null });
  });

  it("merged PR: explains why, no counts, no Regenerate and no Scan now", () => {
    renderCard(NO_SCAN_SUMMARY, "ADMIN", {
      prState: "MERGED",
      hasScan: false,
    });

    expect(screen.getByText("Not scanned yet")).toBeInTheDocument();
    expect(
      screen.getByText("This pull request has not been scanned yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Merged and closed pull requests are not scanned."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/critical$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/suggestions$/)).not.toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByText("Regenerate")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Scan now" }),
    ).not.toBeInTheDocument();
    // The diff size is still known.
    expect(screen.getByText("3 files · +10 −2")).toBeInTheDocument();
  });

  it("open PR: a Reviewer can start a scan", async () => {
    renderCard(NO_SCAN_SUMMARY, "REVIEWER", { hasScan: false });

    expect(
      screen.queryByText("Merged and closed pull requests are not scanned."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Scan now" }));

    await waitFor(() => expect(scanPullRequest).toHaveBeenCalledTimes(1));
    expect(scanPullRequest).toHaveBeenCalledWith("org_1", "repo_1", "pr_1");
  });

  it("open PR: a Viewer is told who can scan", () => {
    renderCard(NO_SCAN_SUMMARY, "VIEWER", { hasScan: false });

    expect(
      screen.getByText("Ask an Admin or Reviewer to scan this pull request."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("AiSummaryCard — done", () => {
  it("shows the summary, model and finding counts", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AiSummaryCard
          orgId="org_1"
          repoId="repo_1"
          id="pr_1"
          summary={{
            ...STALE_SUMMARY,
            aiStatus: "done",
            summaryMd: "Looks **good** overall.",
            riskLevel: "low",
            model: "claude-sonnet-5-5",
            error: null,
          }}
          criticalCount={2}
          suggestionCount={5}
          filesChanged={3}
          additions={10}
          deletions={2}
          settingsHref="/acme/settings"
          role="ADMIN"
          prState="OPEN"
          hasScan
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Looks/)).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-5-5")).toBeInTheDocument();
    expect(screen.getByText("2 critical")).toBeInTheDocument();
    expect(screen.getByText("5 suggestions")).toBeInTheDocument();
    expect(screen.getByText(/RISK/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Regenerate/ })).toBeVisible();
  });
});
