import type { RealtimeDomainEvent } from "@/lib/types/realtime.types";

// Event names we listen for; EventSource ignores any other `event:` name.
export const REALTIME_DOMAIN_EVENTS: RealtimeDomainEvent["type"][] = [
  "scan.updated",
  "pull.updated",
  "review.updated",
  "comment.updated",
  "integration.updated",
  "repo.updated",
  "settings.updated",
];

// One scan fires several events within a second — invalidate once.
export const REALTIME_BATCH_MS = 250;

// A hidden tab keeps no stream open for longer than this.
export const REALTIME_HIDDEN_CLOSE_MS = 120_000;

// Retry delays once the stream is unavailable (401/403/429 or BE down).
export const REALTIME_BACKOFF_MS = [5_000, 10_000, 30_000, 60_000];

// With the stream open, polling is only a safety net.
export const REALTIME_SAFETY_POLL_MS = 30_000;
