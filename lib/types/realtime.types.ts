import type { AiSummaryStatus } from "./pull-request.types";

export type RealtimeStatus = "connecting" | "open" | "unavailable";

export type RealtimeRevokeReason = "membership_revoked" | "session_expired";

interface RealtimeEventBase {
  orgId: string;
  at: string;
}

export interface ScanUpdatedEvent extends RealtimeEventBase {
  type: "scan.updated";
  repoId: string;
  pullId: string;
  scanId: string;
  status: "queued" | "running" | "done" | "failed" | "superseded";
  aiStatus: AiSummaryStatus | null;
}

export interface PullUpdatedEvent extends RealtimeEventBase {
  type: "pull.updated";
  repoId: string;
  pullId: string;
  state: "open" | "closed" | "merged";
  headChanged: boolean;
}

export interface ReviewUpdatedEvent extends RealtimeEventBase {
  type: "review.updated";
  repoId: string;
  pullId: string;
  reviewId: string;
  syncStatus: "pending" | "synced" | "failed";
}

export interface CommentUpdatedEvent extends RealtimeEventBase {
  type: "comment.updated";
  repoId: string;
  pullId: string;
  commentId: string;
  change: "created" | "edited" | "deleted" | "synced" | "sync_failed";
}

export interface IntegrationUpdatedEvent extends RealtimeEventBase {
  type: "integration.updated";
  source: "github" | "gitlab";
  // Lowercase integration state, or "disconnected".
  state: string;
}

export interface RepoUpdatedEvent extends RealtimeEventBase {
  type: "repo.updated";
  repoId: string;
  change: "connected" | "scan_config_updated" | "language_detected";
}

export interface SettingsUpdatedEvent extends RealtimeEventBase {
  type: "settings.updated";
  area: "ai" | "rules" | "organization";
}

// Events carry no display data — only which data changed.
export type RealtimeDomainEvent =
  | ScanUpdatedEvent
  | PullUpdatedEvent
  | ReviewUpdatedEvent
  | CommentUpdatedEvent
  | IntegrationUpdatedEvent
  | RepoUpdatedEvent
  | SettingsUpdatedEvent;
