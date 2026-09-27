import type { IconName } from "@/components/ui/icon/Icon";
import type {
  EffectivePolicy,
  FindingSeverity,
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

// Rule ids are namespaced by category — `secret.aws_access_key`,
// `code.sql_string_concat`, `config.cors_wildcard_credentials`. Those three
// prefixes cover the whole static ruleset, so the icon keys off the segment
// before the first dot; AI findings may use other prefixes and fall back.
const FINDING_CATEGORY_ICON: Record<string, IconName> = {
  secret: "TbShieldLock",
  code: "TbAlertCircle",
  config: "TbAdjustmentsHorizontal",
};

export const getFindingIcon = (ruleId: string): IconName =>
  FINDING_CATEGORY_ICON[ruleId.split(".")[0]] ?? "TbAlertTriangle";
