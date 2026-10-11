import {
  AI_SUMMARY_BLOCKED_STATE,
  AI_SUMMARY_STALE_STATE,
  isAiSummaryBlocked,
} from "@/const/pull-request.constant";
import type { Role } from "@/lib/types/auth.types";
import type {
  AiSummaryBlockedStatus,
  AiSummaryStatus,
  PullRequestSummary,
} from "@/lib/types/pull-request.types";

// For these the BE re-evaluates against the org's current AI setup, so
// `error.code` (what is missing now) wins over the scan's `aiStatus`.
const SETUP_CODES: AiSummaryBlockedStatus[] = [
  "not_configured",
  "consent_required",
];

export interface AiBlockedView {
  code: AiSummaryBlockedStatus;
  isStale: boolean;
  title: string;
  body: string;
  tone: "indigo" | "warning" | "neutral";
  action: "run" | "settings" | null;
  // Shown when the viewer's role cannot take the action.
  roleNote: string | null;
}

const isSetupCode = (code: string): code is AiSummaryBlockedStatus =>
  (SETUP_CODES as string[]).includes(code);

// `role` is undefined while membership loads; no action or note is shown then.
export const getAiBlockedView = (
  summary: PullRequestSummary | undefined,
  role: Role | undefined,
): AiBlockedView | null => {
  if (!summary || !isAiSummaryBlocked(summary.aiStatus)) return null;

  const detail = typeof summary.error === "object" ? summary.error : null;
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
    tone: state.tone,
    action: state.hasSettingsAction && isAdmin ? "settings" : null,
    roleNote:
      state.hasSettingsAction && role && !isAdmin
        ? (state.nonAdminNote ?? null)
        : null,
  };
};

export interface UncheckedTiersNotice {
  tone: "warning" | "info";
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
