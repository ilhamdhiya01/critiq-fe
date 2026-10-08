export const GITLAB_DEFAULT_INSTANCE_URL = "https://gitlab.com";

// Copy for the codes the BE puts in errors[0].message.
export const GITLAB_ERROR_MESSAGE: Record<string, string> = {
  token_invalid: "Token invalid or revoked.",
  scope_missing: "Token needs the api scope.",
  no_maintainer_project: "Token has no Maintainer access to any project.",
  token_missing_expiry: "Token must have an expiry date.",
  instance_unreachable: "GitLab instance unreachable — check the URL.",
  provider_unreachable: "GitLab is not responding, try again later.",
  provider_bad_request: "GitLab rejected the request.",
};

export const INTEGRATION_FORBIDDEN_MESSAGE =
  "Only Admins can change integrations.";

export const GITHUB_RETURN_TOAST = {
  connected: { variant: "success", message: "GitHub connected" },
  pending_approval: {
    variant: "info",
    message: "Waiting for approval from the GitHub org owner",
  },
  error: { variant: "error", message: "Failed to connect GitHub, try again" },
  updated: {
    variant: "success",
    message: "Repository access updated on GitHub",
  },
} as const;

export type GitHubReturnStatus = keyof typeof GITHUB_RETURN_TOAST;
