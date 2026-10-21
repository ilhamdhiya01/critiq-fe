import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type {
  ActivityPage,
  ReviewActivityItem,
} from "@/lib/types/activity.types";
import { getOrgActivity } from "@/services/activity.service";
import { getOrgRepositories } from "@/services/repositories.service";

import ActivityView from "../ActivityView";

// First render can be slow when the whole suite runs in parallel.
const SLOW = { timeout: 5000 };

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/services/activity.service", () => ({
  getOrgActivity: vi.fn(),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

const item = (
  id: string,
  overrides: Partial<ReviewActivityItem> = {},
): ReviewActivityItem => ({
  id,
  decision: "approve",
  aiAssisted: true,
  sync: { status: "synced" },
  reviewer: { id: "u1", name: "Priya Natarajan", avatarUrl: null },
  pull: {
    id: "pr_1",
    number: "482",
    title: "Rate limiter",
    repoId: "repo_1",
    repoPath: "acme/payments-api",
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

const page = (
  items: ReviewActivityItem[],
  nextCursor: string | null,
  counts: ActivityPage["counts"] = { all: 13, approve: 5, request_changes: 8 },
) => ({ data: { items, nextCursor, counts } });

const renderView = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId="org_1">
        <ActivityView />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("ActivityView", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(getOrgActivity).mockReset();
    vi.mocked(getOrgRepositories).mockResolvedValue({ data: [] });
  });

  it("shows tab counts from page 1 and loads more with the BE cursor", async () => {
    vi.mocked(getOrgActivity)
      .mockResolvedValueOnce(page([item("a")], "cursor_2"))
      .mockResolvedValueOnce(
        page([item("b", { decision: "request_changes" })], null, {
          all: 99,
          approve: 99,
          request_changes: 99,
        }),
      );
    renderView();

    expect(
      await screen.findByRole("button", { name: "All · 13" }, SLOW),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approved · 5" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Changes · 8" })).toBeVisible();
    expect(screen.queryByText(/Rejected/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(
      await screen.findByText("requested changes", undefined, SLOW),
    ).toBeInTheDocument();
    expect(getOrgActivity).toHaveBeenLastCalledWith("org_1", {
      decision: "all",
      mode: "all",
      cursor: "cursor_2",
      limit: 20,
    });
    // Counts still from page 1, and nothing more to load.
    expect(screen.getByRole("button", { name: "All · 13" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("starts again from page 1 when the tab or mode changes", async () => {
    vi.mocked(getOrgActivity).mockResolvedValue(page([item("a")], "cursor_2"));
    renderView();
    await screen.findByText("Priya Natarajan", undefined, SLOW);

    fireEvent.click(screen.getByRole("button", { name: "Approved · 5" }));
    await waitFor(() =>
      expect(getOrgActivity).toHaveBeenLastCalledWith("org_1", {
        decision: "approve",
        mode: "all",
        cursor: undefined,
        limit: 20,
      }),
    );

    fireEvent.click(screen.getByRole("radio", { name: "AI-Assisted" }));
    await waitFor(() =>
      expect(getOrgActivity).toHaveBeenLastCalledWith("org_1", {
        decision: "approve",
        mode: "ai_assisted",
        cursor: undefined,
        limit: 20,
      }),
    );
  });

  it("renders a timeline row with a link to the PR", async () => {
    vi.mocked(getOrgActivity).mockResolvedValue(
      page([item("a"), item("b", { reviewer: null })], null),
    );
    renderView();

    expect(
      await screen.findByText("TODAY", undefined, SLOW),
    ).toBeInTheDocument();
    expect(screen.getAllByText("#482")[0]).toHaveAttribute(
      "href",
      "/acme/pull-requests/pr_1?repoId=repo_1",
    );
    expect(screen.getByText("Deleted user")).toBeInTheDocument();
    expect(screen.getAllByText(/AI-Assisted ·/)).toHaveLength(2);
  });

  it("shows the right empty state with and without filters", async () => {
    vi.mocked(getOrgActivity).mockResolvedValue(
      page([], null, { all: 0, approve: 0, request_changes: 0 }),
    );
    renderView();

    expect(
      await screen.findByText("No reviews yet", undefined, SLOW),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Manual" }));
    expect(
      await screen.findByText("No reviews match this filter", undefined, SLOW),
    ).toBeInTheDocument();
  });
});
