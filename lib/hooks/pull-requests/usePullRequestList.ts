import { useQuery } from "@tanstack/react-query";

import { getPullRequests } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const usePullRequestList = (orgId?: string) => {
  return useQuery({
    queryKey: pullRequestKeys.list(orgId ?? ""),
    queryFn: () => getPullRequests(orgId as string),
    select: (response) => response.data ?? [],
    enabled: !!orgId,
  });
};
