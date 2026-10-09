export const repositoryKeys = {
  all: ["repositories"] as const,
  lists: () => [...repositoryKeys.all, "list"] as const,
  org: (orgId: string) => [...repositoryKeys.all, "org", orgId] as const,
  scanConfig: (orgId: string, repoId: string) =>
    [...repositoryKeys.all, "scan-config", orgId, repoId] as const,
  pulls: (orgId: string, repoId: string) =>
    [...repositoryKeys.all, "pulls", orgId, repoId] as const,
  repoScans: (orgId: string, repoId: string) =>
    [...repositoryKeys.all, "repo-scans", orgId, repoId] as const,
  branches: (orgId: string, repoId: string, search: string) =>
    [...repositoryKeys.all, "branches", orgId, repoId, search] as const,
  detail: (id: string) => [...repositoryKeys.all, "detail", id] as const,
  scans: (id: string) => [...repositoryKeys.all, "scans", id] as const,
};
