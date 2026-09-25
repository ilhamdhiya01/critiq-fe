export const pullRequestKeys = {
  all: ["pull-requests"] as const,
  lists: () => [...pullRequestKeys.all, "list"] as const,
  list: (orgId: string) => [...pullRequestKeys.lists(), orgId] as const,
  details: () => [...pullRequestKeys.all, "detail"] as const,
  detail: (orgId: string, repoId: string, id: string) =>
    [...pullRequestKeys.details(), orgId, repoId, id] as const,
  diffs: () => [...pullRequestKeys.all, "diff"] as const,
  diff: (orgId: string, repoId: string, id: string) =>
    [...pullRequestKeys.diffs(), orgId, repoId, id] as const,
};
