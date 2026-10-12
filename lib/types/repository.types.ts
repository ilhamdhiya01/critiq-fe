import type { IntegrationProvider } from "./integration.types";

export type BranchPolicy = "manual_only" | "allow_ai" | "require_both";

// Fields marked optional are additive on the BE; hide their UI when missing.
export interface OrgRepository {
  id: string;
  provider: IntegrationProvider;
  path: string;
  defaultBranch: string;
  monitoredBranchCount: number;
  // null until the provider reports it (older repos: after the next scan).
  language?: string | null;
  openPullCount?: number;
  openCriticalCount?: number;
  lastScanAt?: string | null;
}

export type RepoScanStatus =
  "DONE" | "FAILED" | "RUNNING" | "QUEUED" | "SUPERSEDED";

export interface RepoScan {
  id: string;
  status: RepoScanStatus;
  trigger: "WEBHOOK" | "MANUAL" | "RESCAN";
  criticalCount: number;
  createdAt: string;
  finishedAt: string | null;
  pull: { id: string; number: string; title: string };
}

export type RepoCountByProvider = Record<IntegrationProvider, number>;

export interface BranchPolicyEntry {
  branch: string;
  policy: BranchPolicy;
}

export interface ScanConfig {
  defaultBranch: string;
  branches: string[];
  // One entry per `branches` item, same order. Missing on older BE versions.
  policies?: BranchPolicyEntry[];
  missing: string[];
  missingCheckStatus: string;
  defaultBranchChangedAt: string | null;
}

export interface UpdateScanConfigInput {
  branches: string[];
  policies?: BranchPolicyEntry[];
}

export interface ConnectProjectInput {
  id: string;
  monitoredBranches: string[];
}

export interface ConnectedRepo {
  status: "ok";
  repoId: string;
  path: string;
  defaultBranch: string;
  monitoredBranches: string[];
  webhook: {
    status: "installed" | "app_managed" | "not_configured" | "failed";
  };
}

export interface FailedConnectRepo {
  status: "failed";
  providerRepoId: number;
  error: "provider_unreachable" | "unknown_branch" | "already_connected";
  branch?: string;
}

export type ConnectRepositoryItem = ConnectedRepo | FailedConnectRepo;

export interface ConnectRepositoryInput {
  source: "github" | "gitlab";
  projects: ConnectProjectInput[];
  defaultPolicy: BranchPolicy;
}

export interface ConnectRepositoryResult {
  items: ConnectRepositoryItem[];
}
