import type { ReviewDecision } from "./pull-request.types";

export interface PullRef {
  id: string;
  number: string;
  title: string;
  repoId: string;
  repoPath: string;
}

// One review decision — the same shape in Activity and the dashboard's
// Recent Activity.
export interface ReviewActivityItem {
  id: string;
  decision: ReviewDecision;
  aiAssisted: boolean;
  sync: { status: "pending" | "synced" | "failed" };
  // null when the reviewer's account was deleted.
  reviewer: { id: string; name: string; avatarUrl: string | null } | null;
  pull: PullRef;
  createdAt: string;
}

export type ActivityDecisionFilter = ReviewDecision | "all";
export type ActivityModeFilter = "all" | "manual" | "ai_assisted";

export interface ActivityFilters {
  decision: ActivityDecisionFilter;
  mode: ActivityModeFilter;
}

export interface ActivityPage {
  items: ReviewActivityItem[];
  // null once there is nothing left to load.
  nextCursor: string | null;
  // Follows the mode filter, never the decision filter.
  counts: { all: number; approve: number; request_changes: number };
}
