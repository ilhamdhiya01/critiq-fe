import type {
  BranchPolicy,
  FailedConnectRepo,
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
