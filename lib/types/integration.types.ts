export type IntegrationSource = "github" | "gitlab";

export type TokenKind = "group" | "personal";

export type IntegrationState =
  "active" | "expiring_soon" | "token_expired" | "invalid";

export interface GitLabGroup {
  id: number;
  fullPath: string;
}

export interface GitLabIntegration {
  state: IntegrationState;
  tokenKind: TokenKind;
  tokenUsername: string;
  tokenLast4: string;
  expiresAt: string;
  groups: GitLabGroup[];
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
