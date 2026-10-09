import type { IconName } from "@/components/ui/icon/Icon";
import type {
  AiSummaryBlockedStatus,
  AiSummaryRiskLevel,
  AiSummaryStatus,
  EffectivePolicy,
  FindingSeverity,
  FindingSource,
  PullRequest,
  PullRequestState,
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
    body: "Manual review — the model is not called for this PR. Rule findings are still listed below.",
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
  // Branch policy is manual-only: the BE never calls the model.
  policyManualNotice:
    "Manual review — AI assistance is off; the model is not called for this PR. Rule findings are still listed below.",
  // The reviewer picked Manual: AI may have run, its output is just hidden.
  chosenManualNotice:
    "Manual review — AI results are hidden while you review on your own. Rule findings are still listed below.",
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
  status: AiSummaryStatus | undefined,
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

export const getFindingIcon = (ruleId: string): IconName =>
  FINDING_CATEGORY_ICON[ruleId.split(".")[0]] ?? "TbAlertTriangle";
