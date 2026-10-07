import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiResponse } from "@/lib/types/api.types";
import type { PullRequestSummary } from "@/lib/types/pull-request.types";
import { getPullRequestSummary } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

const POLL_INTERVAL_MS = 3000;
const IN_PROGRESS_STATUSES = new Set(["queued", "running"]);

const isInProgress = (status: string | undefined) =>
  !!status && IN_PROGRESS_STATUSES.has(status);

export const usePullRequestSummary = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const queryClient = useQueryClient();
  const queryKey = pullRequestKeys.summary(orgId, repoId, id);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous =
        queryClient.getQueryData<ApiResponse<PullRequestSummary>>(queryKey);
      const response = await getPullRequestSummary(orgId, repoId, id);

      // AI findings land on the PR detail (latestScan.findings), so refresh
      // it once a run finishes — otherwise Flagged Issues stays stale.
      if (
        isInProgress(previous?.data.aiStatus) &&
        !isInProgress(response.data.aiStatus)
      ) {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.detail(orgId, repoId, id),
        });
      }

      return response;
    },
    select: (response) => response.data,
    enabled: !!orgId && !!repoId && !!id,
    refetchInterval: (query) =>
      isInProgress(query.state.data?.data.aiStatus) ? POLL_INTERVAL_MS : false,
  });
};
