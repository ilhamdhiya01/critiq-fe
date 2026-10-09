import {
  AI_SUMMARY_BLOCKED_STATE,
  AI_SUMMARY_STALE_STATE,
  isAiSummaryBlocked,
} from "@/const/pull-request.constant";
import type { Role } from "@/lib/types/auth.types";
import type {
  AiSummaryBlockedStatus,
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
