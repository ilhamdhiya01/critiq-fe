import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";
import type { RepoCandidate } from "@/lib/types/integration.types";
import { getIntegrationRepoBranches } from "@/services/integrations.service";

import RepoPicker from "../RepoPicker";

vi.mock("@/services/integrations.service", () => ({
  getIntegrationRepoBranches: vi.fn(),
}));

const CANDIDATES: RepoCandidate[] = [
  { id: 101, path: "acme/api", lang: "Go", visibility: "private" },
  { id: 102, path: "acme/legacy", lang: null, visibility: "public" },
];

const BRANCHES = {
  data: {
    defaultBranch: "main",
    branches: ["main", "dev"],
    total: 2,
    truncated: false,
  },
};

const apiError = (status: number, code?: string) => ({
  message: `Request failed with status code ${status}`,
  response: {
    status,
    data: code ? { errors: [{ field: "repo", message: code }] } : {},
  },
});

type PickerProps = React.ComponentProps<typeof RepoPicker>;

const renderPicker = (props: Partial<PickerProps> = {}) => {
  const handlers = {
    onToggleRepo: vi.fn(),
    onToggleBranch: vi.fn(),
    onBranchesReady: vi.fn(),
    onBlockedChange: vi.fn(),
  };
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RepoPicker
        organizationId="org_1"
        source="github"
        candidates={CANDIDATES}
        isLoading={false}
        selectedRepos={{}}
        selectedBranches={{}}
        emptyState="Nothing here"
        connectedRepos={new Map([["acme/legacy", "repo_legacy"]])}
        getSettingsHref={(id) => `/acme/repositories/${id}`}
        {...handlers}
        {...props}
      />
    </QueryClientProvider>,
  );
  return handlers;
};

// A candidate's whole row (path, checkbox, branch picker, row error).
const rowOf = (path: string) =>
  screen.getByText(path).closest<HTMLElement>(".border-border-row")!;

describe("RepoPicker", () => {
  beforeEach(() => {
    vi.mocked(getIntegrationRepoBranches).mockReset();
    vi.mocked(getIntegrationRepoBranches).mockResolvedValue(BRANCHES);
  });

  it("toggles a repo by its candidate id and fetches nothing until picked", () => {
    const { onToggleRepo } = renderPicker();

    fireEvent.click(screen.getByText("acme/api"));

    expect(onToggleRepo).toHaveBeenCalledWith("101");
    expect(getIntegrationRepoBranches).not.toHaveBeenCalled();
  });

  it("does not toggle an already connected repo and links to its settings", () => {
    const { onToggleRepo } = renderPicker();
    const row = rowOf("acme/legacy");

    fireEvent.click(screen.getByText("acme/legacy"));

    expect(onToggleRepo).not.toHaveBeenCalled();
    expect(within(row).getByRole("checkbox")).toBeDisabled();
    expect(
      within(row).getByRole("link", { name: "Edit settings" }),
    ).toHaveAttribute("href", "/acme/repositories/repo_legacy");
  });

  it("preselects the default branch once a picked repo's branches load", async () => {
    const { onBranchesReady, onBlockedChange } = renderPicker({
      selectedRepos: { "101": true },
    });

    await waitFor(() =>
      expect(onBranchesReady).toHaveBeenCalledWith("101", "main"),
    );
    expect(getIntegrationRepoBranches).toHaveBeenCalledWith(
      "org_1",
      "github",
      101,
      expect.objectContaining({ search: "" }),
    );
    // Blocked while loading, unblocked once loaded.
    expect(onBlockedChange).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(onBlockedChange).toHaveBeenLastCalledWith(false),
    );
  });

  it("does not overwrite branches the user already picked", async () => {
    const { onBranchesReady } = renderPicker({
      selectedRepos: { "101": true },
      selectedBranches: { "101": { main: true, dev: true } },
    });

    expect(await within(rowOf("acme/api")).findByText(/2 of 2/)).toBeVisible();
    expect(onBranchesReady).not.toHaveBeenCalled();
  });

  it("reports branch picks with the repo id", async () => {
    const { onToggleBranch } = renderPicker({
      selectedRepos: { "101": true },
      selectedBranches: { "101": { main: true } },
    });

    fireEvent.click(await within(rowOf("acme/api")).findByText(/1 of 2/));
    fireEvent.click(await screen.findByText("dev"));

    expect(onToggleBranch).toHaveBeenCalledWith("101", "dev");
  });

  it("stays blocked when branches fail and retries on demand", async () => {
    vi.mocked(getIntegrationRepoBranches).mockRejectedValueOnce(apiError(500));
    const { onBlockedChange, onToggleRepo, onBranchesReady } = renderPicker({
      selectedRepos: { "101": true },
    });

    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(onBlockedChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(retry);

    await waitFor(() =>
      expect(onBranchesReady).toHaveBeenCalledWith("101", "main"),
    );
    expect(getIntegrationRepoBranches).toHaveBeenCalledTimes(2);
    expect(onToggleRepo).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(onBlockedChange).toHaveBeenLastCalledWith(false),
    );
  });

  it("explains removed GitHub access instead of offering a retry", async () => {
    vi.mocked(getIntegrationRepoBranches).mockRejectedValue(
      apiError(409, "github_suspended"),
    );
    renderPicker({ selectedRepos: { "101": true } });

    expect(
      await screen.findByText(GITHUB_ACCESS_REMOVED_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });

  it("shows a row error from the last connect attempt", () => {
    renderPicker({ rowErrors: { "101": "Already connected" } });

    expect(
      within(rowOf("acme/api")).getByText("Already connected"),
    ).toBeVisible();
  });
});
