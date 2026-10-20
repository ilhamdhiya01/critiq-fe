import type { IconName } from "@/components/ui/icon/Icon";
import type { SegmentedOption } from "@/components/ui/segmented-control";
import type {
  AiSummaryBlockedStatus,
  AiSummaryRiskLevel,
  AiSummaryStatus,
  CommentSyncError,
  EffectivePolicy,
  FindingSeverity,
  FindingSource,
  MergeBlocker,
  MergeMethod,
  PullRequest,
  PullRequestState,
  ReviewDecision,
  ReviewSyncError,
} from "@/lib/types/pull-request.types";

export const PULL_REQUEST_STATUS_MAP: Record<
  PullRequestState,
  { label: string; dot: string; text: string }
> = {
  OPEN: { label: "Open", dot: "bg-text-muted", text: "text-text-secondary" },
  MERGED: { label: "Merged", dot: "bg-success", text: "text-success" },
  CLOSED: { label: "Closed", dot: "bg-danger", text: "text-danger" },
};

export const PULL_REQUEST_STATUS_BADGE_STYLE: Record<
  PullRequestState,
  { text: string; bg: string; border: string }
> = {
  OPEN: {
    text: "text-text-secondary",
    bg: "bg-raised",
    border: "border-border-default",
  },
  MERGED: {
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/40",
  },
  CLOSED: {
    text: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/40",
  },
};

export const PULL_REQUEST_PROVIDER_ICON: Record<
  PullRequest["provider"],
  IconName
> = {
  GITHUB: "FaGithub",
  GITLAB: "FaGitlab",
};

export const PULL_REQUEST_PROVIDER_LABEL: Record<
  PullRequest["provider"],
  string
> = {
  GITHUB: "GitHub · Pull Request",
  GITLAB: "GitLab · Merge Request",
};

export const PULL_REQUEST_NUMBER_PREFIX: Record<
  PullRequest["provider"],
  string
> = {
  GITHUB: "#",
  GITLAB: "!",
};

export const PULL_REQUEST_POLICY_LABEL: Record<EffectivePolicy, string> = {
  MANUAL_ONLY: "Manual",
  ALLOW_AI: "AI-Assisted",
  REQUIRE_BOTH: "AI + Manual",
};

export const PULL_REQUEST_POLICY_STYLE: Record<
  EffectivePolicy,
  { text: string; bg: string; border: string }
> = {
  MANUAL_ONLY: {
    text: "text-text-secondary",
    bg: "bg-raised",
    border: "border-border-default",
  },
  ALLOW_AI: {
    text: "text-primary-300",
    bg: "bg-primary-500/12",
    border: "border-primary-500/45",
  },
  REQUIRE_BOTH: {
    text: "text-warning-light",
    bg: "bg-warning/10",
    border: "border-warning/40",
  },
};

export const FINDING_SEVERITY_STYLE: Record<
  FindingSeverity,
  { text: string; bg: string; border: string }
> = {
  CRITICAL: {
    text: "text-danger-light",
    bg: "bg-danger/10",
    border: "border-danger/40",
  },
  MAJOR: {
    text: "text-warning-light",
    bg: "bg-warning/10",
    border: "border-warning/40",
  },
  MINOR: {
    text: "text-info-light",
    bg: "bg-info/10",
    border: "border-info/40",
  },
  INFO: {
    text: "text-text-secondary",
    bg: "bg-raised",
    border: "border-border-default",
  },
};

export const FINDING_SOURCE_LABEL: Record<FindingSource, string> = {
  STATIC: "RULE",
  AI: "AI",
};

export const FINDING_SOURCE_STYLE: Record<
  FindingSource,
  { text: string; bg: string; border: string }
> = {
  STATIC: {
    text: "text-danger-light",
    bg: "bg-danger/10",
    border: "border-danger/40",
  },
  AI: {
    text: "text-primary-300",
    bg: "bg-primary-500/12",
    border: "border-primary-500/45",
  },
};

export const AI_SUMMARY_BLOCKED_STATE: Record<
  AiSummaryBlockedStatus,
  {
    title: string;
    body: string;
    tone: "indigo" | "warning" | "neutral";
    hasSettingsAction: boolean;
    // Shown instead of "Open Settings" to non-Admins.
    nonAdminNote?: string;
  }
> = {
  not_configured: {
    title: "No AI provider configured",
    body: "Add a provider and API key for this organization to enable AI summaries. Static rules keep running regardless.",
    tone: "indigo",
    hasSettingsAction: true,
    nonAdminNote: "Ask an Admin to configure an AI provider.",
  },
  consent_required: {
    title: "AI review is waiting for consent",
    body: "Diff content is only sent to the AI provider after an Admin allows it in Settings → AI Provider. Static rules keep running regardless.",
    tone: "indigo",
    hasSettingsAction: true,
    nonAdminNote: "Ask an Admin to allow sending diffs to the AI provider.",
  },
  budget_exceeded: {
    title: "Daily AI budget reached",
    body: "This organization used its daily AI token budget. Admins can raise it in Settings → AI Provider.",
    tone: "warning",
    hasSettingsAction: true,
    nonAdminNote: "Ask an Admin to raise the daily AI budget.",
  },
  skipped_too_large: {
    title: "Diff too large for AI review",
    body: "This PR exceeds the size limit for AI review. Split the PR or review the static findings below.",
    tone: "warning",
    hasSettingsAction: false,
  },
  skipped_manual_mode: {
    title: "AI assistance is off",
    body: "Manual review — the model is not called for this PR. Flagged issues are still listed below.",
    tone: "neutral",
    hasSettingsAction: false,
  },
};

export const REVIEW_MODE_COPY = {
  lockedNote:
    "This branch requires manual review — AI-Assisted mode is disabled by branch policy.",
  freeNote:
    "Either way, the final decision is always yours — AI never auto-approves or merges.",
  lockedTooltip: (targetBranch: string) =>
    `Branch policy for → ${targetBranch} requires manual review — AI-Assisted mode is disabled for this PR.`,
  freeTooltip: "Model analysis assists your review; approval stays manual.",
  manualLockedNote:
    "This branch uses AI-Assisted review — Manual mode is disabled by branch policy.",
  manualLockedTooltip: (targetBranch: string) =>
    `Branch policy for → ${targetBranch} uses AI-Assisted review — Manual mode is disabled for this PR.`,
  // Branch policy is manual-only: the BE never calls the model.
  policyManualNotice:
    "Manual review — AI assistance is off; the model is not called for this PR. Flagged issues are still listed below.",
  // The reviewer picked Manual: only the AI summary is hidden.
  chosenManualNotice:
    "Manual review — the AI summary is hidden while you review on your own. All flagged issues are still listed below.",
} as const;

// The PR was never scanned (`error.code === "no_scan"`), e.g. it was already
// merged when Critiq first saw it. There are no findings to count.
export const AI_SUMMARY_NO_SCAN_CODE = "no_scan";

export const AI_SUMMARY_NO_SCAN_STATE = {
  title: "Not scanned yet",
  fallbackBody: "This pull request has not been scanned yet.",
  closedNote: "Merged and closed pull requests are not scanned.",
  action: "Scan now",
  viewerNote: "Ask an Admin or Reviewer to scan this pull request.",
} as const;

// The scan was blocked, but the org's AI setup is complete now (`error.stale`).
export const AI_SUMMARY_STALE_STATE = {
  title: "AI provider is configured now",
  fallbackBody:
    "AI was not set up when this scan ran. It is now — run the AI review to get a summary.",
  badge: "Not run",
  viewerNote: "Ask an Admin or Reviewer to run the AI review.",
} as const;

export const isAiSummaryBlocked = (
  status: AiSummaryStatus | null | undefined,
): status is AiSummaryBlockedStatus =>
  !!status && status in AI_SUMMARY_BLOCKED_STATE;

export const AI_SUMMARY_RISK_LABEL: Record<AiSummaryRiskLevel, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

export const AI_SUMMARY_RISK_STYLE: Record<
  AiSummaryRiskLevel,
  { text: string; bg: string; border: string }
> = {
  low: {
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/40",
  },
  medium: {
    text: "text-warning-light",
    bg: "bg-warning/10",
    border: "border-warning/40",
  },
  high: {
    text: "text-danger-light",
    bg: "bg-danger/10",
    border: "border-danger/40",
  },
};

const FINDING_CATEGORY_ICON: Record<string, IconName> = {
  config: "TbAdjustmentsHorizontal",
  code: "TbAlertCircle",
  secret: "TbShieldLock",
};

// Diffs with at least this many files get a floating "back to top" button.
export const SCROLL_TO_TOP_MIN_DIFF_FILES = 10;

export const getFindingIcon = (ruleId: string): IconName =>
  FINDING_CATEGORY_ICON[ruleId.split(".")[0]] ?? "TbAlertTriangle";

export const REVIEW_BODY_MAX = 2000;

export const REVIEW_DECISION_LABEL: Record<ReviewDecision, string> = {
  approve: "Approved",
  request_changes: "Changes requested",
};

export const REVIEW_OUTDATED_LABEL = "Outdated — new commits since this review";

// Reviewers list on the PR detail.
export const REVIEWER_OUTDATED_TOOLTIP = "Reviewed an older commit";
export const DELETED_REVIEWER_NAME = "Deleted user";

// Error codes from POST …/review (`{ message: <code> }`).
export const REVIEW_ERROR_MESSAGE: Record<string, string> = {
  head_changed:
    "This pull request got new commits since you opened it. The page was refreshed — check the latest changes and review again.",
  pull_not_open: "This pull request is no longer open.",
  body_required: "Add a reason when requesting changes.",
  manual_confirmation_required: "Confirm the manual review before approving.",
  ai_analysis_required:
    "The AI analysis for this commit hasn't finished yet. Approve is available once it's done.",
  scan_required: "This commit hasn't finished scanning yet.",
  forbidden: "Only Admins and Reviewers can review pull requests.",
};

// Shown in place of the button for my latest decision on this commit.
export const MY_REVIEW_STATUS: Record<ReviewDecision, string> = {
  approve: "You approved this commit",
  request_changes: "You requested changes on this commit",
};

// 409 already_reviewed — e.g. the same decision sent from a second tab.
export const REVIEW_ALREADY_MESSAGE: Record<ReviewDecision, string> = {
  approve: "You already approved this commit.",
  request_changes: "You already requested changes on this commit.",
};

export const REVIEW_APPROVE_BLOCKED_REASON = {
  confirmation: "Confirm the manual review above.",
  aiAnalysis: "Waiting for the AI analysis of this commit to finish.",
} as const;

export const getReviewSyncErrorMessage = (
  error: ReviewSyncError | null,
  provider: string,
): string => {
  switch (error) {
    case "insufficient_permission":
      return `Critiq doesn't have permission to review on ${provider}. An Admin must grant Pull requests: write (GitHub App) or use a token that can approve (GitLab).`;
    case "not_allowed":
      return `${provider} refused the approval (e.g. the token owner is the MR author or not an eligible approver).`;
    case "head_changed":
      return "A new commit arrived before the review was sent.";
    default:
      return `Couldn't reach ${provider} — retry.`;
  }
};

export const COMMENT_BODY_MAX = 10000;

// Poll fast while a comment is on its way to the provider; otherwise slowly
// so comments written on GitHub/GitLab still show up.
export const COMMENTS_POLL_PENDING_MS = 5000;
export const COMMENTS_POLL_IDLE_MS = 30000;

export const COMMENT_ERROR_MESSAGE: Record<string, string> = {
  head_changed:
    "This pull request got new commits — the diff was refreshed. Comment on the latest lines.",
  invalid_parent: "That thread no longer exists on this pull request.",
  forbidden: "Only Admins and Reviewers can comment.",
};

export const getCommentSyncErrorMessage = (
  error: CommentSyncError | null,
  provider: string,
): string => {
  switch (error) {
    case "insufficient_permission":
      return `Critiq can't comment on ${provider} (missing permission).`;
    case "invalid_position":
      return `${provider} couldn't place this comment on that line (the line is no longer in the diff).`;
    case "parent_not_synced":
      return `The thread this replies to isn't on ${provider} yet.`;
    default:
      return `Couldn't reach ${provider} — retry.`;
  }
};

export const MERGE_METHOD_OPTIONS: SegmentedOption<MergeMethod>[] = [
  { value: "merge", label: "Merge commit", tone: "primary" },
  { value: "squash", label: "Squash", tone: "primary" },
];

export const MERGE_OVERRIDE_REASON_MAX = 500;

// pull_not_open hides the button, so it has no reason line.
export const getMergeBlockerReason = (
  blocker: Exclude<MergeBlocker, "pull_not_open">,
  criticalCount: number,
): string => {
  switch (blocker) {
    case "approval_required":
      return "Needs an approval on the latest commit";
    case "changes_requested":
      return "Changes were requested on the latest commit";
    case "scan_required":
      return "Waiting for the scan of the latest commit";
    case "critical_findings":
      return criticalCount === 1
        ? "1 critical finding must be resolved"
        : `${criticalCount} critical findings must be resolved`;
  }
};

const MERGE_BLOCKER_CODES = new Set<string>([
  "pull_not_open",
  "approval_required",
  "changes_requested",
  "scan_required",
  "critical_findings",
]);

export const isMergeBlockerCode = (code: string): code is MergeBlocker =>
  MERGE_BLOCKER_CODES.has(code);

// Errors from POST …/merge. `not_mergeable` shows the provider's `detail`.
export const getMergeErrorMessage = (
  code: string,
  provider: string,
): string | null => {
  if (code === "head_changed") {
    return "This pull request got new commits — the page was refreshed. Check the latest changes before merging.";
  }
  if (isMergeBlockerCode(code)) {
    return "This pull request can't be merged right now — the page was refreshed with the current state.";
  }
  switch (code) {
    case "override_requires_admin":
      return "Only Admins can merge with open critical findings.";
    case "insufficient_permission":
      return `Critiq doesn't have permission to merge on ${provider}. An Admin must grant it in ${provider}.`;
    case "provider_unreachable":
      return `Couldn't reach ${provider} — try again.`;
    default:
      return null;
  }
};
