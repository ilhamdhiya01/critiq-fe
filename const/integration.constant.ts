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

export const GITHUB_UNINSTALLED_MESSAGE =
  "The Critiq app was removed from GitHub. Reinstall it to resume scanning, or disconnect to remove these repositories from Critiq.";

export const GITHUB_SUSPENDED_MESSAGE =
  "The Critiq app is suspended on GitHub. Unsuspend it in GitHub to resume scanning.";

// 409 from candidates / connect / branches / PR diff once the App is gone.
export const GITHUB_ACCESS_ERROR_CODES = [
  "github_uninstalled",
  "github_suspended",
] as const;

export const GITHUB_ACCESS_REMOVED_MESSAGE =
  "GitHub access was removed — an Admin can reinstall or disconnect in Settings → Integrations.";

export const GITHUB_UNREACHABLE_MESSAGE =
  "Couldn't reach GitHub — nothing was removed. Try again.";

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
