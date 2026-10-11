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

export type QualityGateStatus = "passed" | "failed" | "pending";
export type CiAggregate = "success" | "failure" | "pending" | "none";

export type QualityGateReason =
  | "not_scanned"
  | "scan_failed"
  | "scan_running"
  | "critical_findings"
  | "ci_failed"
  | "ci_running"
  | "ci_not_detected"
  | "stale_scan";

// Named PrQualityGate because repository.types.ts already exports a legacy
// `QualityGate` union ("PASSED" | "FAILED") for the old Repository shape.
export interface PrQualityGate {
  status: QualityGateStatus;
  reasons: QualityGateReason[];
  ci: CiAggregate;
  // Enabled tiers the scan never checked because they need an AI review and
  // none ran (Manual only, no provider, diff too large, failed). Informational
  // only — never blocks the gate.
  uncheckedTiers: RuleTierId[];
}

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
  // Rules-profile & AI-run snapshot shipped together with the quality gate.
  // Optional on older BE versions.
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
  // Absent on responses from before the rules/profile rollout — keep the
  // criticalCount-based rendering for those rows.
  qualityGate?: PrQualityGate;
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
  scanId: string;
  aiStatus: AiSummaryStatus;
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
