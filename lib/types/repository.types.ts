export type QualityGate = "PASSED" | "FAILED";
export type QualityRating = "A" | "B" | "C";
export type ScanStatus = "idle" | "scanning";

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
  name: string;
}
