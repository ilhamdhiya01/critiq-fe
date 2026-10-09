import type { SegmentedOption } from "@/components/ui/segmented-control";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type { EffectivePolicy } from "@/lib/types/pull-request.types";
import type {
  BranchPolicy,
  FailedConnectRepo,
  RepoScanStatus,
} from "@/lib/types/repository.types";

export const DEFAULT_BRANCH_POLICY: BranchPolicy = "allow_ai";

export const BRANCH_POLICY_OPTIONS: {
  value: BranchPolicy;
  label: string;
  description: string;
}[] = [
  {
    value: "manual_only",
    label: "Manual only",
    description: "AI-Assisted mode is disabled for PRs targeting main.",
  },
  {
    value: "allow_ai",
    label: "Allow AI",
    description: "Reviewer chooses Manual or AI-Assisted per PR — recommended.",
  },
  {
    value: "require_both",
    label: "Require both",
    description:
      "AI analysis and manual confirmation must both complete before approval.",
  },
];

const BRANCH_POLICY_TONE: Record<
  BranchPolicy,
  SegmentedOption<BranchPolicy>["tone"]
> = {
  manual_only: "neutral",
  allow_ai: "primary",
  require_both: "warning",
};

// The same options as a segmented control (repo detail policy rows).
export const BRANCH_POLICY_SEGMENTS: SegmentedOption<BranchPolicy>[] =
  BRANCH_POLICY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    title: option.description,
    tone: BRANCH_POLICY_TONE[option.value],
  }));

export const CONNECT_REPO_ERROR_MESSAGE: Record<
  FailedConnectRepo["error"],
  string
> = {
  already_connected: "Already connected",
  unknown_branch: "Branch {branch} not found",
  provider_unreachable: "Could not reach {provider}, try again",
};

export const WEBHOOK_FAILED_MESSAGE =
  "Connected, but the webhook could not be installed — PRs will not be scanned automatically";

export const CONNECT_REPOS_FORBIDDEN_MESSAGE =
  "Only Admins can connect repositories";

export const CANDIDATES_TOKEN_EXPIRED_MESSAGE =
  "Token expired — replace it in Integrations";

export const SCAN_CONFIG_ERROR_MESSAGE: Record<string, string> = {
  empty_scope: "Keep at least one branch in scope.",
  invalid_branch_name: "This branch name is not valid.",
  policy_branch_not_in_scope:
    "A policy was set for a branch that is not monitored.",
  duplicate_policy_branch: "This branch has more than one policy.",
  unknown_branch: "This branch no longer exists in the repository.",
};

// 409 when Critiq can't reach the provider to check newly added branches.
export const PROVIDER_ACCESS_ERROR_MESSAGE: Record<string, string> = {
  github_uninstalled:
    "GitHub access was removed — an Admin can reinstall it in Settings → Integrations.",
  github_suspended:
    "The Critiq app is suspended on GitHub — an Admin can fix this in Settings → Integrations.",
  token_expired:
    "The access token expired — an Admin can replace it in Settings → Integrations.",
};

export const PROVIDER_NAME: Record<IntegrationProvider, string> = {
  GITHUB: "GitHub",
  GITLAB: "GitLab",
};

export const SCAN_CONFIG_FORBIDDEN_MESSAGE =
  "Only Admins can change review policies";

export const SCAN_CONFIG_HELP_TEXT =
  "Critiq scans pull requests that target these branches. Policy changes apply to pull requests opened from now on.";

export const BRANCHES_MUST_EXIST_NOTE =
  "Branches must already exist in the repository — Critiq doesn't create branches.";

// No search box: branches past the BE limit can't be picked here.
export const BRANCH_LIST_TRUNCATED_HINT =
  "Showing the first 50 branches of this repository.";

export const FINAL_APPROVAL_NOTE = "Final approval is always manual.";

// Repo detail polls pulls/scans while a scan is queued or running.
export const REPO_SCAN_POLL_INTERVAL_MS = 3000;

export const ACTIVE_REPO_SCAN_STATUSES: ReadonlySet<RepoScanStatus> = new Set([
  "QUEUED",
  "RUNNING",
]);

// Status of the scan itself — never a quality gate (no PASSED/FAILED gate yet).
export const SCAN_STATUS_LABEL: Record<RepoScanStatus, string> = {
  DONE: "Done",
  FAILED: "Failed",
  RUNNING: "Scanning…",
  QUEUED: "Scanning…",
  SUPERSEDED: "Superseded",
};

// Wire policy on a PR (effectivePolicy) → the labels used in policy controls.
export const EFFECTIVE_POLICY_LABEL: Record<EffectivePolicy, string> = {
  MANUAL_ONLY: "Manual only",
  ALLOW_AI: "Allow AI",
  REQUIRE_BOTH: "Require both",
};
