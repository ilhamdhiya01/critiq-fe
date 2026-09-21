export const pullRequestKeys = {
  all: ["pull-requests"] as const,
  lists: () => [...pullRequestKeys.all, "list"] as const,
  list: (orgId: string) => [...pullRequestKeys.lists(), orgId] as const,
};
