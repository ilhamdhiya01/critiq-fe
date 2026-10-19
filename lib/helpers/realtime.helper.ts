import type { QueryKey } from "@tanstack/react-query";

import { REALTIME_SAFETY_POLL_MS } from "@/const/realtime.constant";
import { aiSettingsKeys } from "@/lib/hooks/ai-settings/queryKeys";
import { dashboardKeys } from "@/lib/hooks/dashboard/queryKeys";
import {
  integrationKeys,
  membershipWithOrgKeys,
} from "@/lib/hooks/integrations/queryKeys";
import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { rulesKeys } from "@/lib/hooks/rules/queryKeys";
import type {
  RealtimeDomainEvent,
  RealtimeStatus,
} from "@/lib/types/realtime.types";

const TERMINAL_SCAN_STATUSES = new Set(["done", "failed", "superseded"]);
const LOST_ACCESS_STATES = new Set([
  "disconnected",
  "uninstalled",
  "suspended",
]);

// The only place that maps an SSE event to the queries it makes stale.
// Unknown event types (the BE may add more) map to nothing.
export const getEventInvalidations = (
  event: RealtimeDomainEvent | { type: string },
  orgId: string,
): QueryKey[] => {
  const typed = event as RealtimeDomainEvent;

  switch (typed.type) {
    case "scan.updated": {
      const { repoId, pullId, status, aiStatus } = typed;
      const keys: QueryKey[] = [
        pullRequestKeys.detail(orgId, repoId, pullId),
        pullRequestKeys.summary(orgId, repoId, pullId),
        repositoryKeys.pulls(orgId, repoId),
        repositoryKeys.repoScans(orgId, repoId),
        pullRequestKeys.list(orgId),
      ];
      const isSettled =
        TERMINAL_SCAN_STATUSES.has(status) ||
        (aiStatus !== "queued" && aiStatus !== "running");
      if (isSettled) {
        keys.push(
          pullRequestKeys.diff(orgId, repoId, pullId),
          repositoryKeys.org(orgId),
          dashboardKeys.org(orgId),
        );
      }
      return keys;
    }

    case "pull.updated": {
      const { repoId, pullId, headChanged } = typed;
      const keys: QueryKey[] = [
        pullRequestKeys.detail(orgId, repoId, pullId),
        repositoryKeys.pulls(orgId, repoId),
        pullRequestKeys.list(orgId),
        repositoryKeys.org(orgId),
        dashboardKeys.org(orgId),
      ];
      if (headChanged) {
        keys.push(
          pullRequestKeys.diff(orgId, repoId, pullId),
          pullRequestKeys.summary(orgId, repoId, pullId),
          pullRequestKeys.reviews(orgId, repoId, pullId),
          pullRequestKeys.comments(orgId, repoId, pullId),
        );
      }
      return keys;
    }

    case "review.updated":
      return [
        pullRequestKeys.reviews(orgId, typed.repoId, typed.pullId),
        pullRequestKeys.detail(orgId, typed.repoId, typed.pullId),
        dashboardKeys.org(orgId),
      ];

    case "comment.updated":
      return [pullRequestKeys.comments(orgId, typed.repoId, typed.pullId)];

    case "integration.updated": {
      const keys: QueryKey[] = [
        integrationKeys.all,
        repositoryKeys.org(orgId),
        repositoryKeys.lists(),
      ];
      if (LOST_ACCESS_STATES.has(typed.state)) keys.push(pullRequestKeys.all);
      return keys;
    }

    case "repo.updated":
      return [
        repositoryKeys.org(orgId),
        repositoryKeys.lists(),
        repositoryKeys.scanConfig(orgId, typed.repoId),
        dashboardKeys.org(orgId),
      ];

    case "settings.updated":
      switch (typed.area) {
        case "ai":
          return [
            aiSettingsKeys.detail(orgId),
            pullRequestKeys.orgSummaries(orgId),
            pullRequestKeys.orgDetails(orgId),
          ];
        case "rules":
          return [rulesKeys.org(orgId)];
        case "organization":
          return [membershipWithOrgKeys.all];
        default:
          return [];
      }

    default:
      return [];
  }
};

// The BE does not replay missed events, so a reconnect refreshes everything
// realtime could have touched.
export const RECONNECT_INVALIDATIONS: QueryKey[] = [
  pullRequestKeys.all,
  repositoryKeys.all,
  integrationKeys.all,
  rulesKeys.all,
  aiSettingsKeys.all,
  dashboardKeys.all,
];

// "active": polling while something is in flight (scan, AI, sync). With the
// stream open it slows to a safety net. "idle": background polling that the
// stream replaces entirely.
export const getPollInterval = (
  status: RealtimeStatus,
  kind: "active" | "idle",
  baseMs: number,
): number | false => {
  if (status !== "open") return baseMs;
  return kind === "active" ? REALTIME_SAFETY_POLL_MS : false;
};
