import { BranchPolicy } from "@/components/features/onboarding/BranchPolicyStep";

export type QualityGate = "PASSED" | "FAILED";
export type QualityRating = "A" | "B" | "C";
export type ScanStatus = "idle" | "scanning";

interface Project {
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
    status: "installed" | "not_configured" | "failed";
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
  projects: Project[];
  defaultPolicy: BranchPolicy;
}

export interface ConnectRepositoryResult {
  items: ConnectRepositoryItem[];
}
