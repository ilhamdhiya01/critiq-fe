import { describe, expect, it } from "vitest";

import type {
  AiSummaryStatus,
  DiffLine,
  PullRequestReview,
} from "@/lib/types/pull-request.types";

import {
  getDiffLinePosition,
  getInlineThreadKey,
  getMyReviewForHead,
  getUncheckedTiersNotice,
} from "../pull-request.helper";

const review = (
  overrides: Partial<PullRequestReview> = {},
): PullRequestReview => ({
  id: "rev_1",
  decision: "approve",
  body: null,
  headSha: "sha_new",
  reviewer: { id: "u_me", name: "Me", avatarUrl: null },
  reviewerRole: "reviewer",
  effectivePolicy: "manual_only",
  manualConfirmation: true,
  outdated: false,
  sync: { status: "synced", error: null, syncedAt: null },
  createdAt: "2026-08-15T12:00:00Z",
  ...overrides,
});

const line = (overrides: Partial<DiffLine>): DiffLine => ({
  type: "context",
  oldLineNumber: null,
  newLineNumber: null,
  content: "",
  ...overrides,
});

describe("pull-request.helper (reviews, unchecked tiers, inline comments)", () => {
  describe("getMyReviewForHead", () => {
    it("returns my newest review on the current head", () => {
      const newest = review({ id: "rev_2", decision: "request_changes" });
      const older = review({ id: "rev_1" });

      expect(getMyReviewForHead([newest, older], "u_me", "sha_new")).toBe(
        newest,
      );
    });

    it("ignores my reviews on an older head and other reviewers", () => {
      const reviews = [
        review({ id: "rev_old", headSha: "sha_old" }),
        review({
          id: "rev_other",
          reviewer: { id: "u_other", name: "Other", avatarUrl: null },
        }),
        review({ id: "rev_gone", reviewer: null }),
      ];

      expect(getMyReviewForHead(reviews, "u_me", "sha_new")).toBeNull();
    });

    it("returns null while reviews, me or the head are unknown", () => {
      const reviews = [review()];

      expect(getMyReviewForHead(undefined, "u_me", "sha_new")).toBeNull();
      expect(getMyReviewForHead(reviews, undefined, "sha_new")).toBeNull();
      expect(getMyReviewForHead(reviews, "u_me", null)).toBeNull();
      expect(getMyReviewForHead([], "u_me", "sha_new")).toBeNull();
    });
  });

  describe("getUncheckedTiersNotice", () => {
    it.each<AiSummaryStatus>(["queued", "running"])(
      "shows nothing while the AI run is %s",
      (status) => {
        expect(getUncheckedTiersNotice(status)).toBeNull();
      },
    );

    it("points manual-mode branches to the quality profile", () => {
      expect(getUncheckedTiersNotice("skipped_manual_mode")).toEqual({
        tone: "warning",
        body: "tidak dicek karena branch ini memakai Manual review.",
        link: { label: "Atur quality profile", target: "rules" },
      });
    });

    it.each<AiSummaryStatus>(["not_configured", "consent_required"])(
      "points %s to the AI provider settings",
      (status) => {
        expect(getUncheckedTiersNotice(status)).toEqual({
          tone: "warning",
          body: "tidak dicek — AI provider belum dikonfigurasi.",
          link: { label: "Atur AI provider", target: "settings" },
        });
      },
    );

    it.each<AiSummaryStatus>([
      "failed",
      "skipped_too_large",
      "budget_exceeded",
    ])("explains a failed AI review (%s) without a link", (status) => {
      expect(getUncheckedTiersNotice(status)).toEqual({
        tone: "warning",
        body: "tidak dicek karena AI review gagal pada scan ini.",
        link: null,
      });
    });

    it.each([null, undefined, "done" as const])(
      "falls back to the generic copy for %s",
      (status) => {
        expect(getUncheckedTiersNotice(status)).toEqual({
          tone: "warning",
          body: "tidak dicek — AI review tidak berjalan di scan ini.",
          link: { label: "Atur quality profile", target: "rules" },
        });
      },
    );
  });

  describe("getInlineThreadKey", () => {
    it("keys a thread by path, side and line", () => {
      expect(getInlineThreadKey("src/app.ts", "new", 12)).toBe(
        "src/app.ts:new:12",
      );
      expect(getInlineThreadKey("src/app.ts", "old", 12)).not.toBe(
        getInlineThreadKey("src/app.ts", "new", 12),
      );
    });
  });

  describe("getDiffLinePosition", () => {
    it("places comments on removed lines on the old side", () => {
      expect(
        getDiffLinePosition(line({ type: "removed", oldLineNumber: 4 })),
      ).toEqual({ side: "old", line: 4 });
    });

    it("places comments on added and context lines on the new side", () => {
      expect(
        getDiffLinePosition(line({ type: "added", newLineNumber: 7 })),
      ).toEqual({ side: "new", line: 7 });
      expect(
        getDiffLinePosition(
          line({ type: "context", oldLineNumber: 3, newLineNumber: 5 }),
        ),
      ).toEqual({ side: "new", line: 5 });
    });

    it("returns null for hunk headers", () => {
      expect(getDiffLinePosition(line({ type: "hunk" }))).toBeNull();
    });

    it("returns null when the line has no number on its side", () => {
      expect(
        getDiffLinePosition(line({ type: "removed", newLineNumber: 4 })),
      ).toBeNull();
      expect(
        getDiffLinePosition(line({ type: "added", oldLineNumber: 7 })),
      ).toBeNull();
    });
  });
});
