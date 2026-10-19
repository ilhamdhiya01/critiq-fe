import type { PullRef } from "./activity.types";
import type { FindingSource } from "./pull-request.types";

export interface DashboardSummary {
  openCritical: { count: number; pullCount: number };
  repositories: { count: number; addedThisMonth: number };
  // Hours from PR opened to first review decision, last 7 days vs the 7
  // days before.
  reviewTurnaround: {
    avgHours: number | null;
    previousAvgHours: number | null;
  };
  reviews30d: {
    total: number;
    aiAssisted: number;
    manual: number;
    avgApproveHours: { aiAssisted: number | null; manual: number | null };
  };
}

export interface DashboardCriticalIssue {
  findingId: string;
  title: string;
  source: FindingSource;
  filePath: string;
  lineStart: number;
  firstSeenAt: string;
  pull: PullRef;
}
