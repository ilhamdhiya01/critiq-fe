export type PullRequestProvider = "GITHUB" | "GITLAB";
export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";
export type EffectivePolicy = "MANUAL_ONLY" | "ALLOW_AI" | "REQUIRE_BOTH";
export type PullRequestFilter = "all" | "open" | "merged" | "closed";

export interface PullRequest {
  id: string;
  repositoryId: string;
  repositoryPath: string;
  provider: PullRequestProvider;
  externalId: string;
  title: string;
  authorUsername: string | null;
  sourceBranch: string;
  targetBranch: string;
  state: PullRequestState;
  criticalCount: number;
  effectivePolicy: EffectivePolicy;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequestFile {
  path: string;
  previousPath: string | null;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number | null;
  deletions: number | null;
  patch: string | null;
  truncated: boolean;
}

export interface PullRequestDetail extends PullRequest {
  headSha: string | null;
}

export interface PullRequestDiff {
  files: PullRequestFile[];
  truncated: boolean;
}

export type DiffLineType = "context" | "added" | "removed" | "hunk";
export type DiffFlagSeverity = "critical" | "warning";

export interface DiffLineFlag {
  severity: DiffFlagSeverity;
  label: string;
}

export interface DiffLine {
  type: DiffLineType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface ParsedPullRequestFile extends PullRequestFile {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
}

export interface ParsedPullRequestDiff {
  files: ParsedPullRequestFile[];
  truncated: boolean;
}

export interface PullRequestComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}
