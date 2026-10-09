import type { IntegrationProvider } from "./integration.types";

export type BranchPolicy = "manual_only" | "allow_ai" | "require_both";

export interface OrgRepository {
  id: string;
  provider: IntegrationProvider;
  path: string;
  defaultBranch: string;
  monitoredBranchCount: number;
}

export type RepoCountByProvider = Record<IntegrationProvider, number>;

export type QualityGate = "PASSED" | "FAILED";
export type QualityRating = "A" | "B" | "C";
export type ScanStatus = "idle" | "scanning";

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

export interface Repository {
  id: string;
  name: string;
  source: "github" | "gitlab";
  language: string;
  qualityRating: QualityRating;
  qualityGate: QualityGate | null;
  criticalCount: number;
  defaultBranch: string;
  lastScanAt: string | null;
  scanStatus: ScanStatus;
}

export interface ScanHistoryEntry {
  id: string;
  status: QualityGate;
  criticalCount: number;
  pullRequestNumber: number;
  scannedAt: string;
}

export interface ConnectRepositoryInput {
  source: "github" | "gitlab";
  projects: ConnectProjectInput[];
  defaultPolicy: BranchPolicy;
}

export interface ConnectRepositoryResult {
  items: ConnectRepositoryItem[];
}
