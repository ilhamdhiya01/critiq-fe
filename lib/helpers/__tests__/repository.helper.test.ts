import { describe, expect, it } from "vitest";

import type { RepoCandidate } from "@/lib/types/integration.types";

import { formatConnectedRepoCount } from "../integration.helper";
import {
  countSelectedRepos,
  deselectRepos,
  EMPTY_REPO_SELECTION,
  markDefaultBranch,
  summarizeConnectResult,
  toConnectProjects,
  toggleBranchSelection,
  toggleRepoSelection,
} from "../repository.helper";

const CANDIDATES: RepoCandidate[] = [
  { id: 101, path: "acme/api", lang: "TypeScript", visibility: "private" },
  { id: 202, path: "acme/web", lang: "TypeScript", visibility: "public" },
];

describe("repo selection", () => {
  it("drops a repo's branches when it is unchecked", () => {
    let state = toggleRepoSelection(EMPTY_REPO_SELECTION, "101");
    state = markDefaultBranch(state, "101", "main");
    state = toggleBranchSelection(state, "101", "develop");
    expect(state.selectedBranches["101"]).toEqual({
      main: true,
      develop: true,
    });

    state = toggleRepoSelection(state, "101");
    expect(state.selectedRepos["101"]).toBe(false);
    expect(state.selectedBranches).not.toHaveProperty("101");
  });

  it("pre-selects the default branch only once", () => {
    let state = markDefaultBranch(EMPTY_REPO_SELECTION, "101", "main");
    state = toggleBranchSelection(state, "101", "main");
    const again = markDefaultBranch(state, "101", "main");
    expect(again).toBe(state);
    expect(again.selectedBranches["101"]).toEqual({ main: false });
  });

  it("builds the connect payload with string ids and picked branches", () => {
    let state = toggleRepoSelection(EMPTY_REPO_SELECTION, "101");
    state = markDefaultBranch(state, "101", "main");
    state = toggleBranchSelection(state, "101", "develop");
    state = toggleRepoSelection(state, "202");
    state = markDefaultBranch(state, "202", "trunk");

    expect(countSelectedRepos(state)).toBe(2);
    expect(toConnectProjects(state)).toEqual([
      { id: "101", monitoredBranches: ["main", "develop"] },
      { id: "202", monitoredBranches: ["trunk"] },
    ]);
  });

  it("deselects only the given selected repos", () => {
    let state = toggleRepoSelection(EMPTY_REPO_SELECTION, "101");
    state = toggleRepoSelection(state, "202");
    state = deselectRepos(state, ["101", "999"]);
    expect(countSelectedRepos(state)).toBe(1);
    expect(state.selectedRepos["202"]).toBe(true);
  });
});

describe("summarizeConnectResult", () => {
  it("summarises a full success, including webhook failures", () => {
    const summary = summarizeConnectResult(
      [
        {
          status: "ok",
          repoId: "r1",
          path: "acme/api",
          defaultBranch: "main",
          monitoredBranches: ["main"],
          webhook: { status: "installed" },
        },
        {
          status: "ok",
          repoId: "r2",
          path: "acme/web",
          defaultBranch: "main",
          monitoredBranches: ["main"],
          webhook: { status: "failed" },
        },
      ],
      CANDIDATES,
      "GitLab",
    );

    expect(summary.okCount).toBe(2);
    expect(summary.failedCount).toBe(0);
    expect(summary.okCandidateIds).toEqual(["101", "202"]);
    expect(summary.webhookWarnings).toHaveLength(1);
    expect(summary.webhookWarnings[0].path).toBe("acme/web");
  });

  it("maps failed items to row errors keyed by provider repo id", () => {
    const summary = summarizeConnectResult(
      [
        {
          status: "ok",
          repoId: "r1",
          path: "acme/api",
          defaultBranch: "main",
          monitoredBranches: ["main"],
          webhook: { status: "app_managed" },
        },
        {
          status: "failed",
          providerRepoId: 202,
          error: "unknown_branch",
          branch: "release",
        },
      ],
      CANDIDATES,
      "GitHub",
    );

    expect(summary.okCandidateIds).toEqual(["101"]);
    expect(summary.failedCount).toBe(1);
    expect(summary.rowErrors).toEqual({ "202": "Branch release not found" });
    expect(summary.webhookWarnings).toEqual([]);
  });

  it("fills the provider name into provider_unreachable", () => {
    const summary = summarizeConnectResult(
      [
        {
          status: "failed",
          providerRepoId: 101,
          error: "provider_unreachable",
        },
      ],
      CANDIDATES,
      "GitHub",
    );
    expect(summary.rowErrors["101"]).toBe("Could not reach GitHub, try again");
  });

  it("labels already connected repos", () => {
    const summary = summarizeConnectResult(
      [{ status: "failed", providerRepoId: 101, error: "already_connected" }],
      CANDIDATES,
      "GitLab",
    );
    expect(summary.rowErrors["101"]).toBe("Already connected");
  });
});

describe("formatConnectedRepoCount", () => {
  it("pluralises", () => {
    expect(formatConnectedRepoCount(0)).toBe("0 repos connected");
    expect(formatConnectedRepoCount(1)).toBe("1 repo connected");
    expect(formatConnectedRepoCount(2)).toBe("2 repos connected");
  });
});
