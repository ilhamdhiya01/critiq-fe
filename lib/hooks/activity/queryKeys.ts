import type { ActivityFilters } from "@/lib/types/activity.types";

export const activityKeys = {
  all: ["activity"] as const,
  // Prefix for one org's activity (SSE invalidates this).
  org: (orgId: string) => [...activityKeys.all, orgId] as const,
  list: (orgId: string, filters: ActivityFilters) =>
    [...activityKeys.org(orgId), "list", filters] as const,
};
