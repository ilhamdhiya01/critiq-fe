export const repositoryKeys = {
  all: ["repositories"] as const,
  lists: () => [...repositoryKeys.all, "list"] as const,
  org: (orgId: string) => [...repositoryKeys.all, "org", orgId] as const,
  detail: (id: string) => [...repositoryKeys.all, "detail", id] as const,
  scans: (id: string) => [...repositoryKeys.all, "scans", id] as const,
};
