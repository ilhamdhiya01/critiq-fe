import { useQuery } from "@tanstack/react-query";

import { getPullRequestDetail } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const usePullRequestDetail = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  return useQuery({
    queryKey: pullRequestKeys.detail(orgId, repoId, id),
    queryFn: () => getPullRequestDetail(orgId, repoId, id),
    select: (response) => response.data,
    enabled: !!orgId && !!repoId && !!id,
  });
};
