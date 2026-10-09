import { useQuery, useQueryClient } from "@tanstack/react-query";

import { REPO_SCAN_POLL_INTERVAL_MS } from "@/const/repository.constant";
import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import type { ApiResponse } from "@/lib/types/api.types";
import type { PullRequest } from "@/lib/types/pull-request.types";
import { getRepoPulls } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

const hasActiveScan = (pulls: PullRequest[] | undefined) =>
  !!pulls?.some((pull) => !!pull.activeScan);

export const useRepoPulls = (orgId: string, repoId: string) => {
  const queryClient = useQueryClient();
  const queryKey = repositoryKeys.pulls(orgId, repoId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous =
        queryClient.getQueryData<ApiResponse<PullRequest[]>>(queryKey);
      const response = await getRepoPulls(orgId, repoId);

      // PRs whose scan was active last poll and is gone now have finished.
      const finished = (previous?.data ?? []).filter(
        (pull) =>
          pull.activeScan &&
          !response.data?.find((next) => next.id === pull.id)?.activeScan,
      );

      if (finished.length > 0) {
        finished.forEach((pull) => {
          queryClient.invalidateQueries({
            queryKey: pullRequestKeys.detail(orgId, repoId, pull.id),
          });
          queryClient.invalidateQueries({
            queryKey: pullRequestKeys.summary(orgId, repoId, pull.id),
          });
        });
        // Stats, "last scan" and the scan history depend on finished scans.
        queryClient.invalidateQueries({
          queryKey: repositoryKeys.repoScans(orgId, repoId),
        });
        queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.list(orgId),
        });
      }

      return response;
    },
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId,
    refetchInterval: (query) =>
      hasActiveScan(query.state.data?.data)
        ? REPO_SCAN_POLL_INTERVAL_MS
        : false,
  });
};
