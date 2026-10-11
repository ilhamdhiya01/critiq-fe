export const rulesKeys = {
  all: ["rules"] as const,
  org: (orgId: string) => [...rulesKeys.all, "org", orgId] as const,
};
