import { useQuery } from "@tanstack/react-query";

import { getPullRequestSummary } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

const POLL_INTERVAL_MS = 3000;
const IN_PROGRESS_STATUSES = new Set(["queued", "running"]);

export const usePullRequestSummary = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  return useQuery({
    queryKey: pullRequestKeys.summary(orgId, repoId, id),
    queryFn: () => getPullRequestSummary(orgId, repoId, id),
    select: (response) => response.data,
    enabled: !!orgId && !!repoId && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data.aiStatus;
      return status && IN_PROGRESS_STATUSES.has(status)
        ? POLL_INTERVAL_MS
        : false;
    },
  });
};
