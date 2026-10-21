import { describe, expect, it } from "vitest";

import {
  getEventInvalidations,
  getPollInterval,
  RECONNECT_INVALIDATIONS,
} from "../realtime.helper";

const BASE = { orgId: "org_1", at: "2026-10-13T03:00:00Z" };
const PR = { repoId: "repo_1", pullId: "pr_1" };

const DETAIL = ["pull-requests", "detail", "org_1", "repo_1", "pr_1"];
const SUMMARY = ["pull-requests", "summary", "org_1", "repo_1", "pr_1"];
const DIFF = ["pull-requests", "diff", "org_1", "repo_1", "pr_1"];
const REVIEWS = ["pull-requests", "reviews", "org_1", "repo_1", "pr_1"];
const COMMENTS = ["pull-requests", "comments", "org_1", "repo_1", "pr_1"];
const REPO_PULLS = ["repositories", "pulls", "org_1", "repo_1"];
const REPO_SCANS = ["repositories", "repo-scans", "org_1", "repo_1"];
const PR_LIST = ["pull-requests", "list", "org_1"];
const REPO_ORG = ["repositories", "org", "org_1"];
const DASHBOARD = ["dashboard", "org_1"];
const ACTIVITY = ["activity", "org_1"];
const INSIGHTS = ["insights", "org_1"];

describe("getEventInvalidations", () => {
  it("scan.updated while running refreshes the PR and repo views only", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "scan.updated",
          scanId: "s1",
          status: "running",
          aiStatus: "running",
        },
        "org_1",
      ),
    ).toEqual([DETAIL, SUMMARY, REPO_PULLS, REPO_SCANS, PR_LIST]);
  });

  it("scan.updated while running leaves the dashboard alone", () => {
    const keys = getEventInvalidations(
      {
        ...BASE,
        ...PR,
        type: "scan.updated",
        scanId: "s1",
        status: "queued",
        aiStatus: "queued",
      },
      "org_1",
    );
    expect(keys).not.toContainEqual(DASHBOARD);
    expect(keys).not.toContainEqual(INSIGHTS);
  });

  it.each([
    ["done", "running"],
    ["failed", "queued"],
    ["superseded", "running"],
    ["running", "done"],
    ["running", null],
  ] as const)(
    "scan.updated settled (%s / ai %s) also refreshes the diff and repo list",
    (status, aiStatus) => {
      const keys = getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "scan.updated",
          scanId: "s1",
          status,
          aiStatus,
        },
        "org_1",
      );
      // Scan history too: an AI review finishing (running → done) updates
      // the row's combined status without a reload.
      expect(keys).toEqual(
        expect.arrayContaining([
          DIFF,
          REPO_ORG,
          DASHBOARD,
          INSIGHTS,
          REPO_SCANS,
        ]),
      );
    },
  );

  it("pull.updated without a new head keeps the diff", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "pull.updated",
          state: "merged",
          headChanged: false,
        },
        "org_1",
      ),
    ).toEqual([DETAIL, REPO_PULLS, PR_LIST, REPO_ORG, DASHBOARD]);
  });

  it("pull.updated with a new head refreshes diff, summary, reviews, comments", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "pull.updated",
          state: "open",
          headChanged: true,
        },
        "org_1",
      ),
    ).toEqual([
      DETAIL,
      REPO_PULLS,
      PR_LIST,
      REPO_ORG,
      DASHBOARD,
      DIFF,
      SUMMARY,
      REVIEWS,
      COMMENTS,
    ]);
  });

  it("review.updated and comment.updated touch their PR only", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "review.updated",
          reviewId: "r1",
          syncStatus: "synced",
        },
        "org_1",
      ),
    ).toEqual([REVIEWS, DETAIL, DASHBOARD, ACTIVITY]);
    expect(
      getEventInvalidations(
        {
          ...BASE,
          ...PR,
          type: "comment.updated",
          commentId: "c1",
          change: "created",
        },
        "org_1",
      ),
    ).toEqual([COMMENTS]);
  });

  it("integration.updated drops every PR query once access is lost", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          type: "integration.updated",
          source: "github",
          state: "active",
        },
        "org_1",
      ),
    ).toEqual([["integrations"], REPO_ORG, ["repositories", "list"]]);

    for (const state of ["disconnected", "uninstalled", "suspended"]) {
      expect(
        getEventInvalidations(
          { ...BASE, type: "integration.updated", source: "gitlab", state },
          "org_1",
        ),
      ).toContainEqual(["pull-requests"]);
    }
  });

  it("repo.updated refreshes the repo lists and its scan config", () => {
    expect(
      getEventInvalidations(
        {
          ...BASE,
          type: "repo.updated",
          repoId: "repo_1",
          change: "connected",
        },
        "org_1",
      ),
    ).toEqual([
      REPO_ORG,
      ["repositories", "list"],
      ["repositories", "scan-config", "org_1", "repo_1"],
      DASHBOARD,
    ]);
  });

  it("settings.updated maps each area", () => {
    expect(
      getEventInvalidations(
        { ...BASE, type: "settings.updated", area: "ai" },
        "org_1",
      ),
    ).toEqual([
      ["ai-settings", "detail", "org_1"],
      ["pull-requests", "summary", "org_1"],
      ["pull-requests", "detail", "org_1"],
    ]);
    expect(
      getEventInvalidations(
        { ...BASE, type: "settings.updated", area: "rules" },
        "org_1",
      ),
    ).toEqual([["rules", "org", "org_1"]]);
    expect(
      getEventInvalidations(
        { ...BASE, type: "settings.updated", area: "organization" },
        "org_1",
      ),
    ).toEqual([["memberships"]]);
    expect(
      getEventInvalidations(
        { ...BASE, type: "settings.updated", area: "members" },
        "org_1",
      ),
    ).toEqual([["members", "org_1"]]);
  });

  it("ignores event types it doesn't know", () => {
    expect(getEventInvalidations({ type: "billing.updated" }, "org_1")).toEqual(
      [],
    );
  });

  it("refreshes every realtime-backed area after a reconnect", () => {
    expect(RECONNECT_INVALIDATIONS).toEqual([
      ["pull-requests"],
      ["repositories"],
      ["integrations"],
      ["rules"],
      ["ai-settings"],
      ["dashboard"],
      ["activity"],
      ["members"],
      ["insights"],
    ]);
  });
});

describe("getPollInterval", () => {
  it("slows active polling and stops idle polling while the stream is open", () => {
    expect(getPollInterval("open", "active", 3000)).toBe(30_000);
    expect(getPollInterval("open", "idle", 30_000)).toBe(false);
  });

  it.each(["connecting", "unavailable"] as const)(
    "keeps today's intervals while %s",
    (status) => {
      expect(getPollInterval(status, "active", 3000)).toBe(3000);
      expect(getPollInterval(status, "idle", 30_000)).toBe(30_000);
    },
  );
});
