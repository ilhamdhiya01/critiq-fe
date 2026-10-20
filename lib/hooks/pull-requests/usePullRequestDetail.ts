import { useQuery, useQueryClient } from "@tanstack/react-query";

import { REPO_SCAN_POLL_INTERVAL_MS } from "@/const/repository.constant";
import { sortReviewers } from "@/lib/helpers/pull-request.helper";
import { useLivePollInterval } from "@/lib/hooks/useLivePollInterval";
import type { ApiResponse } from "@/lib/types/api.types";
import type { PullRequestDetail } from "@/lib/types/pull-request.types";
import { getPullRequestDetail } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

const selectDetail = (response: ApiResponse<PullRequestDetail>) => ({
  ...response.data,
  reviewers: sortReviewers(response.data.reviewers ?? []),
});

export const usePullRequestDetail = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const poll = useLivePollInterval();
  const queryClient = useQueryClient();
  const queryKey = pullRequestKeys.detail(orgId, repoId, id);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous =
        queryClient.getQueryData<ApiResponse<PullRequestDetail>>(queryKey);
      const response = await getPullRequestDetail(orgId, repoId, id);

      // A scan just finished (e.g. after "Scan now"): the summary and diff
      // were fetched before it existed.
      if (previous?.data.activeScan && !response.data.activeScan) {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.summary(orgId, repoId, id),
        });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.diff(orgId, repoId, id),
        });
      }

      return response;
    },
    select: selectDetail,
    enabled: !!orgId && !!repoId && !!id,
    // Poll while a scan runs or a review is still syncing to the provider.
    refetchInterval: (query) => {
      const detail = query.state.data?.data;
      return detail?.activeScan ||
        detail?.latestReview?.sync.status === "pending" ||
        detail?.reviewers?.some((entry) => entry.sync.status === "pending")
        ? poll.active(REPO_SCAN_POLL_INTERVAL_MS)
        : false;
    },
  });
};
