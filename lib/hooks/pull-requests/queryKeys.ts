export const pullRequestKeys = {
  all: ["pull-requests"] as const,
  lists: () => [...pullRequestKeys.all, "list"] as const,
  list: (orgId: string) => [...pullRequestKeys.lists(), orgId] as const,
  details: () => [...pullRequestKeys.all, "detail"] as const,
  // Prefix matching every PR detail in one org.
  orgDetails: (orgId: string) => [...pullRequestKeys.details(), orgId] as const,
  detail: (orgId: string, repoId: string, id: string) =>
    [...pullRequestKeys.details(), orgId, repoId, id] as const,
  diffs: () => [...pullRequestKeys.all, "diff"] as const,
  diff: (orgId: string, repoId: string, id: string) =>
    [...pullRequestKeys.diffs(), orgId, repoId, id] as const,
  summaries: () => [...pullRequestKeys.all, "summary"] as const,
  // Prefix matching every PR summary in one org.
  orgSummaries: (orgId: string) =>
    [...pullRequestKeys.summaries(), orgId] as const,
  summary: (orgId: string, repoId: string, id: string) =>
    [...pullRequestKeys.summaries(), orgId, repoId, id] as const,
};
