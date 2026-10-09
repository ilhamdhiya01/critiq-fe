// Lowercase source used as a URL segment (/integrations/github/...).
export type IntegrationSource = "github" | "gitlab";

export type IntegrationProvider = "GITHUB" | "GITLAB";

export type IntegrationCredentialKind =
  "GROUP_TOKEN" | "OAUTH" | "INSTALLATION";

// The BE may add values later — always handle an unknown state.
export type IntegrationStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "TOKEN_EXPIRED"
  | "INVALID"
  | "PENDING_APPROVAL"
  | "UNINSTALLED"
  | "SUSPENDED";

export type GitLabTokenKind = "GROUP" | "PERSONAL";

export interface Integration {
  source: IntegrationProvider;
  credentialKind: IntegrationCredentialKind;
  state: IntegrationStatus;
  // GitLab only (null for GitHub)
  instanceUrl: string | null;
  tokenKind: GitLabTokenKind | null;
  tokenUsername: string | null;
  tokenLast4: string | null;
  expiresAt: string | null;
  groups: unknown;
  // GitHub only (null for GitLab)
  installationId: string | null;
  installationLogin: string | null;
  appSlug: string | null;
}

export interface IntegrationsBySource {
  github: Integration | null;
  gitlab: Integration | null;
}

export interface VerifyGitLabTokenInput {
  instanceUrl: string;
  token: string;
}

export type VerifyGitLabTokenErrorCode =
  | "token_invalid"
  | "scope_missing"
  | "no_maintainer_project"
  | "instance_unreachable"
  | "gitlab_not_connected";

export interface RepoCandidate {
  id: number;
  path: string;
  lang: string | null;
  visibility: "public" | "private";
  accessLevel?: number;
}

export interface RawGitLabRepoCandidate {
  id: number;
  path: string;
  lang: string | null;
  visibility: string;
  accessLevel: number;
}

export interface RawGitHubRepoCandidate {
  id: number;
  path: string;
  lang: string | null;
  private: boolean;
}

export type RawRepoCandidate = RawGitLabRepoCandidate | RawGitHubRepoCandidate;

export interface RepoBranches {
  defaultBranch: string;
  branches: string[];
  total: number;
  truncated: boolean;
}
