import type { RuleTierId } from "./rules.types";

export type PullRequestProvider = "GITHUB" | "GITLAB";
export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";
export type EffectivePolicy = "MANUAL_ONLY" | "ALLOW_AI" | "REQUIRE_BOTH";
export type ReviewMode = "manual" | "ai";
export type PullRequestFilter = "all" | "open" | "merged" | "closed";
export type ScanStatus =
  "QUEUED" | "RUNNING" | "DONE" | "FAILED" | "SUPERSEDED";
export type ScanTrigger = "WEBHOOK" | "MANUAL" | "RESCAN";
export type FindingSource = "STATIC" | "AI";
export type FindingSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

export interface Finding {
  id: string;
  source: FindingSource;
  ruleId: string;
  severity: FindingSeverity;
  title: string;
  message: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  // Nullable on the backend (FindingDto) — a rule can flag a line without
  // capturing the surrounding source.
  snippet: string | null;
}

export interface LatestScan {
  id: string;
  status: ScanStatus;
  trigger: ScanTrigger;
  attempt: number;
  headSha: string;
  findingsCount: number;
  criticalCount: number;
  findingsTruncated: boolean;
  filesChanged: number;
  diffBytes: number;
  rulesetVersion: string;
  errorMessage: string | null;
  findings: Finding[];
  // Rules-profile & AI-run snapshot of this scan. Optional on older BE
  // versions.
  ruleTiers?: RuleTierId[];
  uncheckedTiers?: RuleTierId[];
  aiStatus?: AiSummaryStatus | null;
  aiErrorCode?: string | null;
  aiProvider?: string | null;
  aiModel?: string | null;
  aiCached?: boolean;
  majorCount?: number;
  minorCount?: number;
  aiFindingsDropped?: number;
  aiReportedRiskLevel?: "critical" | "major" | "minor" | "clean" | null;
}

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
  latestScan: LatestScan | null;
  // A scan currently queued/running for this PR, if any.
  activeScan?: { id: string; status: ScanStatus } | null;
  // Latest Approve / Request changes recorded in Critiq. Missing on older BE.
  latestReview?: PullRequestReview | null;
}

export type ReviewDecision = "approve" | "request_changes";
export type ReviewSyncStatus = "pending" | "synced" | "failed";
export type ReviewSyncError =
  | "head_changed"
  | "insufficient_permission"
  | "not_allowed"
  | "provider_unreachable"
  | "unknown";

export interface PullRequestReview {
  id: string;
  decision: ReviewDecision;
  body: string | null;
  headSha: string;
  // null when the reviewer is no longer a member.
  reviewer: { id: string; name: string; avatarUrl: string | null } | null;
  reviewerRole: "admin" | "reviewer";
  effectivePolicy: "manual_only" | "allow_ai" | "require_both";
  manualConfirmation: boolean;
  // The decision was made in AI-Assisted mode. Missing on older BE.
  aiAssisted?: boolean;
  // true once the PR has commits newer than `headSha`.
  outdated: boolean;
  // Delivery of the decision to GitHub/GitLab (done in the background).
  sync: {
    status: ReviewSyncStatus;
    error: ReviewSyncError | null;
    syncedAt: string | null;
  };
  createdAt: string;
}

export interface SubmitReviewInput {
  decision: ReviewDecision;
  headSha: string;
  body?: string;
  manualConfirmation?: boolean;
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
  // Whether Critiq may merge right now. Missing on older BE → no Merge button.
  merge?: PullRequestMerge;
}

// Why a merge is not allowed, in the BE's priority order.
export type MergeBlocker =
  | "pull_not_open"
  | "approval_required"
  | "changes_requested"
  | "scan_required"
  | "critical_findings";

export interface PullRequestMerge {
  allowed: boolean;
  blockers: MergeBlocker[];
}

export type MergeMethod = "merge" | "squash";

export interface MergePullRequestInput {
  headSha: string;
  method: MergeMethod;
  deleteSourceBranch?: boolean;
  // Admin only: merge despite open critical findings (audited).
  overrideCritical?: { reason: string };
}

export interface MergePullRequestResult {
  state: "merged";
  method: MergeMethod;
  headSha: string;
  mergedAt: string;
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

export type CommentOrigin = "critiq" | "github" | "gitlab";
export type CommentSyncStatus = "pending" | "synced" | "failed";
export type CommentSyncError =
  | "insufficient_permission"
  | "invalid_position"
  | "parent_not_synced"
  | "provider_unreachable"
  | "unknown";

export interface PullRequestComment {
  id: string;
  origin: CommentOrigin;
  author: {
    // Critiq user name, or the provider username for provider comments.
    name: string;
    avatarUrl: string | null;
    critiqUserId: string | null;
    providerUsername: string | null;
  };
  body: string;
  createdAt: string;
  editedAt: string | null;
  // Deleted on the provider side.
  deleted: boolean;
  // Delivery to the provider; null for comments that came from it.
  sync: { status: CommentSyncStatus; error: CommentSyncError | null } | null;
}

export type CommentSide = "new" | "old";

export interface CommentThread {
  // Id of the root comment.
  id: string;
  kind: "general" | "inline";
  path: string | null;
  // Line number on `side` (inline only).
  line: number | null;
  side: CommentSide | null;
  headSha: string | null;
  // Inline: the PR head moved on, so the line may have shifted.
  outdated: boolean;
  // Root first, then replies oldest → newest.
  comments: PullRequestComment[];
}

export interface InlineCommentPosition {
  path: string;
  line: number;
  side: CommentSide;
  headSha: string;
}

// Who/where comments are written — passed down the comment components.
export interface CommentScope {
  orgId: string;
  repoId: string;
  pullId: string;
  // Commit inline comments are placed on; null until the BE knows it.
  headSha: string | null;
  providerName: string;
  // Admin/Reviewer; Viewers only read.
  canComment: boolean;
}

export type CreateCommentInput =
  | { body: string }
  | { body: string; inline: InlineCommentPosition }
  | { body: string; parentId: string };

export type AiSummaryStatus =
  | "queued"
  | "running"
  | "done"
  | "cached"
  | "failed"
  | "skipped_manual_mode"
  | "consent_required"
  | "not_configured"
  | "skipped_too_large"
  | "budget_exceeded";

// Statuses where the AI run did not (and will not) produce a summary.
export type AiSummaryBlockedStatus = Exclude<
  AiSummaryStatus,
  "queued" | "running" | "done" | "cached" | "failed"
>;

export type AiSummaryRiskLevel = "low" | "medium" | "high";

export interface PullRequestSummaryErrorDetail {
  code: string;
  hint: string;
  // True when the scan was blocked (not_configured / consent_required) but
  // the org's AI setup is complete now. Missing on older BE versions.
  stale?: boolean;
}

export interface PullRequestSummary {
  // Both null when the PR was never scanned (error.code "no_scan").
  scanId: string | null;
  aiStatus: AiSummaryStatus | null;
  summaryMd: string | null;
  riskLevel: AiSummaryRiskLevel | null;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
  cached: boolean;
  filesOmitted: string[];
  tokens: { in: number; out: number } | null;
  // Backend has been seen sending this as either a plain string or a
  // structured { code, hint } object — never render it directly.
  error: string | PullRequestSummaryErrorDetail | null;
}
