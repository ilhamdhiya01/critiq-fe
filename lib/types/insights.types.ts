import type { FindingSource } from "./pull-request.types";

export interface InsightsTopRule {
  ruleId: string;
  label: string;
  source: FindingSource;
  count: number;
}

export interface InsightsWeek {
  // Monday, YYYY-MM-DD.
  weekStart: string;
  static: number;
  ai: number;
}

export interface InsightsData {
  // New (or reappearing) criticals found by scans, excluding suppressed.
  criticalFound: { last30d: number; previous30d: number };
  // Non-suppressed criticals that stopped appearing in their PR.
  criticalResolved: { last30d: number; previous30d: number };
  // First detection until the finding no longer appears in the PR.
  meanTimeToResolveHours: {
    last30d: number | null;
    previous30d: number | null;
  };
  // Oldest → newest; empty weeks are 0.
  weekly: InsightsWeek[];
  // At most 5, most frequent first.
  topRules: InsightsTopRule[];
}
