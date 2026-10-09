import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type { PullRequestSummary } from "@/lib/types/pull-request.types";
import { regeneratePullRequestSummary } from "@/services/pull-requests.service";

import AiSummaryCard from "../AiSummaryCard";

vi.mock("@/services/pull-requests.service", () => ({
  regeneratePullRequestSummary: vi.fn(),
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

const renderCard = (summary: PullRequestSummary, role: Role) =>
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
