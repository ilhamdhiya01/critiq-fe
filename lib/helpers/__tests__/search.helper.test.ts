import { describe, expect, it } from "vitest";

import type { GlobalSearchResult } from "@/lib/types/search.types";

import {
  buildSearchEntries,
  filterSearchPages,
  getRepoMeta,
  getRepoName,
  isSearchableQuery,
  splitHighlight,
} from "../search.helper";

const RESULT: GlobalSearchResult = {
  repositories: [
    {
      id: "repo_1",
      path: "acme/payments-api",
      language: "Go",
      openCriticalCount: 3,
    },
  ],
  pulls: [
    {
      id: "pr_1",
      repoId: "repo_1",
      repoPath: "acme/payments-api",
      number: "482",
      title: "Refactor auth token",
      state: "merged",
      updatedAt: "2026-10-12T03:00:00Z",
    },
  ],
  rules: [
    {
      kind: "tier",
      id: "breaking_change",
      label: "Breaking change",
      tier: "breaking_change",
    },
    {
      kind: "rule",
      id: "code.debugger_left",
      label: "Debugger left in code",
      tier: "crash",
    },
  ],
};

describe("isSearchableQuery", () => {
  it("needs 1–100 characters after trimming", () => {
    expect(isSearchableQuery("")).toBe(false);
    expect(isSearchableQuery("   ")).toBe(false);
    expect(isSearchableQuery(" pay ")).toBe(true);
    expect(isSearchableQuery("x".repeat(100))).toBe(true);
    expect(isSearchableQuery("x".repeat(101))).toBe(false);
  });
});

describe("filterSearchPages", () => {
  it("filters pages by name, case-insensitively", () => {
    expect(filterSearchPages("ins").map((page) => page.label)).toEqual([
      "Insights",
    ]);
    expect(filterSearchPages("RE").map((page) => page.label)).toEqual([
      "Pull Requests",
      "Repositories",
    ]);
    expect(filterSearchPages("zzz")).toEqual([]);
  });

  it("lists every page for an empty query", () => {
    expect(filterSearchPages("  ")).toHaveLength(7);
  });
});

describe("getRepoMeta", () => {
  const repo = RESULT.repositories[0];

  it("prefers open criticals, then the language, then nothing", () => {
    expect(getRepoMeta(repo)).toEqual({ kind: "critical", text: "3 critical" });
    expect(getRepoMeta({ ...repo, openCriticalCount: 0 })).toEqual({
      kind: "language",
      text: "Go",
    });
    expect(
      getRepoMeta({ ...repo, openCriticalCount: 0, language: null }),
    ).toBeNull();
  });
});

describe("buildSearchEntries", () => {
  it("orders groups and links each kind to its page", () => {
    const entries = buildSearchEntries(
      RESULT,
      filterSearchPages("settings"),
      "acme",
    );

    expect(
      entries.map((entry) => [entry.group, entry.label, entry.href]),
    ).toEqual([
      ["repositories", "acme/payments-api", "/acme/repositories/repo_1"],
      [
        "pulls",
        "#482 Refactor auth token",
        "/acme/pull-requests/pr_1?repoId=repo_1",
      ],
      ["rules", "Breaking change", "/acme/rules?tier=breaking_change"],
      ["rules", "Debugger left in code", "/acme/rules?tier=crash"],
      ["pages", "Settings", "/acme/settings"],
    ]);
    expect(entries[1].meta).toEqual({
      kind: "pull",
      repoPath: "acme/payments-api",
      state: "merged",
    });
    // A rule shows its owning tier; a tier needs no extra label.
    expect(entries[3].meta).toEqual({
      kind: "text",
      text: "Bug penyebab crash",
    });
    expect(entries[2].meta).toBeNull();
  });

  it("shows only pages without results", () => {
    const entries = buildSearchEntries(
      undefined,
      filterSearchPages(""),
      "acme",
    );
    expect(entries.every((entry) => entry.group === "pages")).toBe(true);
  });
});

describe("splitHighlight", () => {
  it("marks every case-insensitive match", () => {
    expect(splitHighlight("Pay the payments-api", "pay")).toEqual([
      { text: "Pay", isMatch: true },
      { text: " the ", isMatch: false },
      { text: "pay", isMatch: true },
      { text: "ments-api", isMatch: false },
    ]);
    expect(splitHighlight("#482 Fix", "#482")[0]).toEqual({
      text: "#482",
      isMatch: true,
    });
    expect(splitHighlight("abc", "")).toEqual([
      { text: "abc", isMatch: false },
    ]);
  });
});

describe("getRepoName", () => {
  it("keeps the last path segment", () => {
    expect(getRepoName("acme/backend/payments-api")).toBe("payments-api");
    expect(getRepoName("solo")).toBe("solo");
  });
});

describe("buildSearchEntries rule labels", () => {
  it("never treats an inherited name as a known tier", () => {
    const [entry] = buildSearchEntries(
      {
        repositories: [],
        pulls: [],
        rules: [
          { kind: "rule", id: "x.y", label: "Weird", tier: "constructor" },
        ],
      },
      [],
      "acme",
    );

    expect(entry.meta).toEqual({ kind: "text", text: "constructor" });
  });
});
