import {
  AI_SUMMARY_BLOCKED_STATE,
  AI_SUMMARY_NO_SCAN_CODE,
  AI_SUMMARY_NO_SCAN_STATE,
  AI_SUMMARY_STALE_STATE,
  isAiSummaryBlocked,
} from "@/const/pull-request.constant";
import type { Role } from "@/lib/types/auth.types";
import type {
  AiSummaryBlockedStatus,
  AiSummaryStatus,
  CommentSide,
  DiffLine,
  PullRequestReview,
  PullRequestReviewer,
  PullRequestState,
  PullRequestSummary,
} from "@/lib/types/pull-request.types";

// For these the BE re-evaluates against the org's current AI setup, so
// `error.code` (what is missing now) wins over the scan's `aiStatus`.
const SETUP_CODES: AiSummaryBlockedStatus[] = [
  "not_configured",
  "consent_required",
];

export interface AiBlockedView {
  code: AiSummaryBlockedStatus | typeof AI_SUMMARY_NO_SCAN_CODE;
  isStale: boolean;
  title: string;
  body: string;
  // Extra context under the body (e.g. why a merged PR has no scan).
  note: string | null;
  tone: "indigo" | "warning" | "neutral";
  action: "run" | "settings" | "scan" | null;
  // Shown when the viewer's role cannot take the action.
  roleNote: string | null;
}

const isSetupCode = (code: string): code is AiSummaryBlockedStatus =>
  (SETUP_CODES as string[]).includes(code);

// My latest decision on this exact commit. Reviews come newest first, so the
// first match wins; a review on an older head never matches.
export const getMyReviewForHead = (
  reviews: readonly PullRequestReview[] | undefined,
  meId: string | undefined,
  headSha: string | null,
): PullRequestReview | null => {
  if (!reviews || !meId || !headSha) return null;
  return (
    reviews.find(
      (review) => review.reviewer?.id === meId && review.headSha === headSha,
    ) ?? null
  );
};

// `role` is undefined while membership loads; no action or note is shown then.
// `error.code` is checked before `aiStatus`: a PR without any scan has no
// aiStatus at all.
export const getAiBlockedView = (
  summary: PullRequestSummary | undefined,
  role: Role | undefined,
  prState: PullRequestState = "OPEN",
): AiBlockedView | null => {
  if (!summary) return null;

  const detail = typeof summary.error === "object" ? summary.error : null;

  if (detail?.code === AI_SUMMARY_NO_SCAN_CODE) {
    // The BE never scans merged/closed PRs, so there is nothing to offer.
    const isOpen = prState === "OPEN";
    const canScan = role === "ADMIN" || role === "REVIEWER";
    return {
      code: AI_SUMMARY_NO_SCAN_CODE,
      isStale: false,
      title: AI_SUMMARY_NO_SCAN_STATE.title,
      body: detail.hint || AI_SUMMARY_NO_SCAN_STATE.fallbackBody,
      note: isOpen ? null : AI_SUMMARY_NO_SCAN_STATE.closedNote,
      tone: "neutral",
      action: isOpen && canScan ? "scan" : null,
      roleNote:
        isOpen && role && !canScan ? AI_SUMMARY_NO_SCAN_STATE.viewerNote : null,
    };
  }

  if (!isAiSummaryBlocked(summary.aiStatus)) return null;
  const code =
    isSetupCode(summary.aiStatus) && detail && isSetupCode(detail.code)
      ? detail.code
      : summary.aiStatus;

  if (isSetupCode(code) && detail?.stale === true) {
    const canRun = role === "ADMIN" || role === "REVIEWER";
    return {
      code,
      isStale: true,
      title: AI_SUMMARY_STALE_STATE.title,
      body: detail.hint || AI_SUMMARY_STALE_STATE.fallbackBody,
      note: null,
      tone: "indigo",
      action: canRun ? "run" : null,
      roleNote: role && !canRun ? AI_SUMMARY_STALE_STATE.viewerNote : null,
    };
  }

  const state = AI_SUMMARY_BLOCKED_STATE[code];
  const isAdmin = role === "ADMIN";
  return {
    code,
    isStale: false,
    title: state.title,
    body: state.body,
    note: null,
    tone: state.tone,
    action: state.hasSettingsAction && isAdmin ? "settings" : null,
    roleNote:
      state.hasSettingsAction && role && !isAdmin
        ? (state.nonAdminNote ?? null)
        : null,
  };
};

export interface UncheckedTiersNotice {
  tone: "warning" | "note";
  // Sentence after the tier list, e.g. "… sedang diperiksa AI review."
  body: string;
  link: { label: string; target: "rules" | "settings" } | null;
}

// `uncheckedTiers` only says a tier was not checked *at this moment* — it
// carries no reason. Why it was skipped (and therefore what the reader should
// do about it) lives entirely in `aiStatus`, so the copy is chosen from that.
//
// Returns null while the AI run is still in flight: a warning that the tiers
// "were not checked" contradicts the spinner running beside it, and there is
// nothing for the reader to act on until the run settles.
export const getUncheckedTiersNotice = (
  aiStatus: AiSummaryStatus | null | undefined,
): UncheckedTiersNotice | null => {
  switch (aiStatus) {
    case "queued":
    case "running":
      return null;

    case "skipped_manual_mode":
      return {
        tone: "warning",
        body: "tidak dicek karena branch ini memakai Manual review.",
        link: { label: "Atur quality profile", target: "rules" },
      };

    case "not_configured":
    case "consent_required":
      return {
        tone: "warning",
        body: "tidak dicek — AI provider belum dikonfigurasi.",
        link: { label: "Atur AI provider", target: "settings" },
      };

    case "failed":
    case "skipped_too_large":
    case "budget_exceeded":
      return {
        tone: "warning",
        body: "tidak dicek karena AI review gagal pada scan ini.",
        link: null,
      };

    // done/cached clear uncheckedTiers upstream, so reaching here means an
    // older BE that omits aiStatus — keep the original generic wording.
    default:
      return {
        tone: "warning",
        body: "tidak dicek — AI review tidak berjalan di scan ini.",
        link: { label: "Atur quality profile", target: "rules" },
      };
  }
};

// Groups inline threads by the diff line they sit on.
export const getInlineThreadKey = (
  path: string,
  side: CommentSide,
  line: number,
): string => `${path}:${side}:${line}`;

// Where a comment on this diff row lands: removed rows on the old side,
// added/context rows on the new side.
export const getDiffLinePosition = (
  line: DiffLine,
): { side: CommentSide; line: number } | null => {
  if (line.type === "removed") {
    return line.oldLineNumber !== null
      ? { side: "old", line: line.oldLineNumber }
      : null;
  }
  if (line.type === "added" || line.type === "context") {
    return line.newLineNumber !== null
      ? { side: "new", line: line.newLineNumber }
      : null;
  }
  return null;
};

// Decisions on the current commit first, then outdated ones; newest first
// within each group.
export const sortReviewers = (
  reviewers: readonly PullRequestReviewer[],
): PullRequestReviewer[] =>
  [...reviewers].sort(
    (a, b) =>
      Number(a.outdated) - Number(b.outdated) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

export interface ReviewersOverview {
  // Decisions on the current commit, in display order.
  current: PullRequestReviewer[];
  approvals: number;
  changeRequests: number;
  outdated: number;
}

// Counts for the one-line summary. Outdated decisions are only counted.
export const getReviewersOverview = (
  reviewers: readonly PullRequestReviewer[],
): ReviewersOverview => {
  const current = reviewers.filter((entry) => !entry.outdated);
  const approvals = current.filter(
    (entry) => entry.decision === "approve",
  ).length;
  return {
    current,
    approvals,
    changeRequests: current.length - approvals,
    outdated: reviewers.length - current.length,
  };
};

// A decision just submitted replaces that reviewer's entry and goes on top
// (it's on the current commit).
export const upsertReviewer = (
  reviewers: readonly PullRequestReviewer[] | undefined,
  review: PullRequestReview,
): PullRequestReviewer[] => [
  {
    reviewId: review.id,
    reviewer: review.reviewer,
    decision: review.decision,
    headSha: review.headSha,
    outdated: review.outdated,
    aiAssisted: review.aiAssisted ?? false,
    sync: { status: review.sync.status, error: review.sync.error },
    createdAt: review.createdAt,
  },
  ...(reviewers ?? []).filter(
    (entry) =>
      entry.reviewId !== review.id &&
      (!review.reviewer || entry.reviewer?.id !== review.reviewer.id),
  ),
];
