export const insightsKeys = {
  all: ["insights"] as const,
  // Prefix for one org's insights (SSE invalidates this).
  org: (orgId: string) => [...insightsKeys.all, orgId] as const,
  detail: (orgId: string, weeks: number) =>
    [...insightsKeys.org(orgId), weeks] as const,
};
