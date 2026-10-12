import { describe, expect, it } from "vitest";

import type { PullRequestSummary } from "@/lib/types/pull-request.types";

import { getAiBlockedView } from "../pull-request.helper";

const STALE_HINT =
  "No AI provider was configured when this scan ran. One is configured now — an Admin or Reviewer can regenerate to run the AI review.";

const buildSummary = (
  overrides: Partial<PullRequestSummary>,
): PullRequestSummary => ({
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
  error: null,
  ...overrides,
});

describe("getAiBlockedView", () => {
  it("stale + Admin/Reviewer → 'configured now' with Run AI review, no settings", () => {
    const summary = buildSummary({
      error: { code: "not_configured", hint: STALE_HINT, stale: true },
    });

    for (const role of ["ADMIN", "REVIEWER"] as const) {
      const view = getAiBlockedView(summary, role);
      expect(view?.isStale).toBe(true);
      expect(view?.title).toBe("AI provider is configured now");
      expect(view?.body).toBe(STALE_HINT);
      expect(view?.action).toBe("run");
      expect(view?.roleNote).toBeNull();
    }
  });

  it("stale + Viewer → no action, asks an Admin or Reviewer", () => {
    const view = getAiBlockedView(
      buildSummary({
        error: { code: "not_configured", hint: STALE_HINT, stale: true },
      }),
      "VIEWER",
    );
    expect(view?.action).toBeNull();
    expect(view?.roleNote).toBe(
      "Ask an Admin or Reviewer to run the AI review.",
    );
  });

  it("not stale + not_configured → old UI, Open Settings for Admins only", () => {
    const summary = buildSummary({
      error: { code: "not_configured", hint: "x", stale: false },
    });

    const admin = getAiBlockedView(summary, "ADMIN");
    expect(admin?.isStale).toBe(false);
    expect(admin?.title).toBe("No AI provider configured");
    expect(admin?.action).toBe("settings");

    const reviewer = getAiBlockedView(summary, "REVIEWER");
    expect(reviewer?.action).toBeNull();
    expect(reviewer?.roleNote).toBe(
      "Ask an Admin to configure an AI provider.",
    );
  });

  it("picks the UI from error.code, not aiStatus", () => {
    const view = getAiBlockedView(
      buildSummary({
        aiStatus: "not_configured",
        error: { code: "consent_required", hint: "x", stale: false },
      }),
      "ADMIN",
    );
    expect(view?.code).toBe("consent_required");
    expect(view?.title).toBe("AI review is waiting for consent");
  });

  it("treats a missing stale flag as false (older BE)", () => {
    const view = getAiBlockedView(
      buildSummary({ error: { code: "not_configured", hint: "x" } }),
      "ADMIN",
    );
    expect(view?.isStale).toBe(false);
    expect(view?.action).toBe("settings");
  });

  it("keeps the scan status for non-setup blocks and ignores stale there", () => {
    const view = getAiBlockedView(
      buildSummary({
        aiStatus: "budget_exceeded",
        error: { code: "budget_exceeded", hint: "x", stale: true },
      }),
      "ADMIN",
    );
    expect(view?.isStale).toBe(false);
    expect(view?.title).toBe("Daily AI budget reached");
  });

  it("returns null for statuses that are not blocked", () => {
    expect(
      getAiBlockedView(buildSummary({ aiStatus: "done" }), "ADMIN"),
    ).toBeNull();
    expect(getAiBlockedView(undefined, "ADMIN")).toBeNull();
  });

  it("shows no action or note while the role is still loading", () => {
    const view = getAiBlockedView(
      buildSummary({
        error: { code: "not_configured", hint: STALE_HINT, stale: true },
      }),
      undefined,
    );
    expect(view?.action).toBeNull();
    expect(view?.roleNote).toBeNull();
  });

  describe("no_scan", () => {
    const NO_SCAN = buildSummary({
      scanId: null,
      aiStatus: null,
      error: {
        code: "no_scan",
        hint: "This pull request has not been scanned yet.",
        stale: false,
      },
    });

    it("checks error.code before aiStatus and offers Scan now on open PRs", () => {
      const view = getAiBlockedView(NO_SCAN, "REVIEWER", "OPEN");

      expect(view).toMatchObject({
        code: "no_scan",
        title: "Not scanned yet",
        body: "This pull request has not been scanned yet.",
        note: null,
        action: "scan",
        roleNote: null,
      });
    });

    it("explains why merged/closed PRs have no scan and offers no action", () => {
      for (const state of ["MERGED", "CLOSED"] as const) {
        expect(getAiBlockedView(NO_SCAN, "ADMIN", state)).toMatchObject({
          note: "Merged and closed pull requests are not scanned.",
          action: null,
          roleNote: null,
        });
      }
    });

    it("tells Viewers who can scan", () => {
      expect(getAiBlockedView(NO_SCAN, "VIEWER", "OPEN")).toMatchObject({
        action: null,
        roleNote: "Ask an Admin or Reviewer to scan this pull request.",
      });
    });
  });
});
