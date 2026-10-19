export const dashboardKeys = {
  all: ["dashboard"] as const,
  // Prefix for everything on one org's dashboard (SSE invalidates this).
  org: (orgId: string) => [...dashboardKeys.all, orgId] as const,
  summary: (orgId: string) => [...dashboardKeys.org(orgId), "summary"] as const,
  criticalIssues: (orgId: string, limit: number) =>
    [...dashboardKeys.org(orgId), "critical-issues", limit] as const,
  recentReviews: (orgId: string, limit: number) =>
    [...dashboardKeys.org(orgId), "recent-reviews", limit] as const,
};
