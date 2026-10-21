import { describe, expect, it } from "vitest";

import type {
  AiSummaryStatus,
  MergeBlocker,
} from "@/lib/types/pull-request.types";

import {
  getCommentSyncErrorMessage,
  getFindingIcon,
  getMergeBlockerReason,
  getMergeErrorMessage,
  getReviewSyncErrorMessage,
  isAiSummaryBlocked,
  isMergeBlockerCode,
  REVIEW_MODE_COPY,
} from "../pull-request.constant";

const MERGE_BLOCKERS: MergeBlocker[] = [
  "pull_not_open",
  "approval_required",
  "changes_requested",
  "scan_required",
  "critical_findings",
];

describe("pull-request.constant", () => {
  describe("isAiSummaryBlocked", () => {
    it.each<AiSummaryStatus>([
      "not_configured",
      "consent_required",
      "budget_exceeded",
      "skipped_too_large",
      "skipped_manual_mode",
    ])("treats %s as blocked", (status) => {
      expect(isAiSummaryBlocked(status)).toBe(true);
    });

    it.each<AiSummaryStatus>(["queued", "running", "done", "cached", "failed"])(
      "does not treat %s as blocked",
      (status) => {
        expect(isAiSummaryBlocked(status)).toBe(false);
      },
    );

    it("is false without a status", () => {
      expect(isAiSummaryBlocked(null)).toBe(false);
      expect(isAiSummaryBlocked(undefined)).toBe(false);
    });

    it("rejects object prototype keys sent as a status", () => {
      expect(isAiSummaryBlocked("toString" as AiSummaryStatus)).toBe(false);
      expect(isAiSummaryBlocked("constructor" as AiSummaryStatus)).toBe(false);
    });
  });

  describe("REVIEW_MODE_COPY tooltips", () => {
    it("name the target branch of the locked policy", () => {
      expect(REVIEW_MODE_COPY.lockedTooltip("main")).toBe(
        "Branch policy for → main requires manual review — AI-Assisted mode is disabled for this PR.",
      );
      expect(REVIEW_MODE_COPY.manualLockedTooltip("release/1.0")).toBe(
        "Branch policy for → release/1.0 uses AI-Assisted review — Manual mode is disabled for this PR.",
      );
    });
  });

  describe("getFindingIcon", () => {
    it("picks the icon from the rule id category", () => {
      expect(getFindingIcon("config.debug-enabled")).toBe(
        "TbAdjustmentsHorizontal",
      );
      expect(getFindingIcon("code.empty-catch")).toBe("TbAlertCircle");
      expect(getFindingIcon("secret.aws-key")).toBe("TbShieldLock");
      expect(getFindingIcon("secret")).toBe("TbShieldLock");
    });

    it("falls back to a warning icon for unknown categories", () => {
      expect(getFindingIcon("perf.n-plus-one")).toBe("TbAlertTriangle");
      expect(getFindingIcon("")).toBe("TbAlertTriangle");
    });
  });

  describe("getReviewSyncErrorMessage", () => {
    it("explains a missing permission on the provider", () => {
      expect(
        getReviewSyncErrorMessage("insufficient_permission", "GitHub"),
      ).toBe(
        "Critiq doesn't have permission to review on GitHub. An Admin must grant Pull requests: write (GitHub App) or use a token that can approve (GitLab).",
      );
    });

    it("explains a refused approval", () => {
      expect(getReviewSyncErrorMessage("not_allowed", "GitLab")).toBe(
        "GitLab refused the approval (e.g. the token owner is the MR author or not an eligible approver).",
      );
    });

    it("explains a head change", () => {
      expect(getReviewSyncErrorMessage("head_changed", "GitHub")).toBe(
        "A new commit arrived before the review was sent.",
      );
    });

    it.each(["provider_unreachable", "unknown", null] as const)(
      "asks to retry for %s",
      (error) => {
        expect(getReviewSyncErrorMessage(error, "GitHub")).toBe(
          "Couldn't reach GitHub — retry.",
        );
      },
    );
  });

  describe("getCommentSyncErrorMessage", () => {
    it("explains each known sync error with the provider name", () => {
      expect(
        getCommentSyncErrorMessage("insufficient_permission", "GitLab"),
      ).toBe("Critiq can't comment on GitLab (missing permission).");
      expect(getCommentSyncErrorMessage("invalid_position", "GitHub")).toBe(
        "GitHub couldn't place this comment on that line (the line is no longer in the diff).",
      );
      expect(getCommentSyncErrorMessage("parent_not_synced", "GitHub")).toBe(
        "The thread this replies to isn't on GitHub yet.",
      );
    });

    it.each(["provider_unreachable", "unknown", null] as const)(
      "asks to retry for %s",
      (error) => {
        expect(getCommentSyncErrorMessage(error, "GitLab")).toBe(
          "Couldn't reach GitLab — retry.",
        );
      },
    );
  });

  describe("getMergeBlockerReason", () => {
    it("explains each blocker", () => {
      expect(getMergeBlockerReason("approval_required", 0)).toBe(
        "Needs an approval on the latest commit",
      );
      expect(getMergeBlockerReason("changes_requested", 0)).toBe(
        "Changes were requested on the latest commit",
      );
      expect(getMergeBlockerReason("scan_required", 0)).toBe(
        "Waiting for the scan of the latest commit",
      );
    });

    it("pluralizes the critical finding count", () => {
      expect(getMergeBlockerReason("critical_findings", 1)).toBe(
        "1 critical finding must be resolved",
      );
      expect(getMergeBlockerReason("critical_findings", 3)).toBe(
        "3 critical findings must be resolved",
      );
    });
  });

  describe("isMergeBlockerCode", () => {
    it.each(MERGE_BLOCKERS)("recognises %s", (code) => {
      expect(isMergeBlockerCode(code)).toBe(true);
    });

    it("rejects other codes", () => {
      expect(isMergeBlockerCode("head_changed")).toBe(false);
      expect(isMergeBlockerCode("")).toBe(false);
    });
  });

  describe("getMergeErrorMessage", () => {
    it("asks to re-check after a head change", () => {
      expect(getMergeErrorMessage("head_changed", "GitHub")).toBe(
        "This pull request got new commits — the page was refreshed. Check the latest changes before merging.",
      );
    });

    it.each(MERGE_BLOCKERS)(
      "reports a refreshed state for blocker %s",
      (code) => {
        expect(getMergeErrorMessage(code, "GitHub")).toBe(
          "This pull request can't be merged right now — the page was refreshed with the current state.",
        );
      },
    );

    it("explains admin-only overrides", () => {
      expect(getMergeErrorMessage("override_requires_admin", "GitHub")).toBe(
        "Only Admins can merge with open critical findings.",
      );
    });

    it("names the provider for permission and reachability errors", () => {
      expect(getMergeErrorMessage("insufficient_permission", "GitLab")).toBe(
        "Critiq doesn't have permission to merge on GitLab. An Admin must grant it in GitLab.",
      );
      expect(getMergeErrorMessage("provider_unreachable", "GitLab")).toBe(
        "Couldn't reach GitLab — try again.",
      );
    });

    it("returns null for unknown codes so the caller shows the provider detail", () => {
      expect(getMergeErrorMessage("not_mergeable", "GitHub")).toBeNull();
      expect(getMergeErrorMessage("", "GitHub")).toBeNull();
    });
  });
});
