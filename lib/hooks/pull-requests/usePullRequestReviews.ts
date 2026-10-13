import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { REPO_SCAN_POLL_INTERVAL_MS } from "@/const/repository.constant";
import { useLivePollInterval } from "@/lib/hooks/useLivePollInterval";
import { getPullRequestReviews } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const usePullRequestReviews = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const poll = useLivePollInterval();
  const query = useQuery({
    queryKey: pullRequestKeys.reviews(orgId, repoId, id),
    queryFn: () => getPullRequestReviews(orgId, repoId, id),
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId && !!id,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.data?.some((review) => review.sync.status === "pending")
        ? poll.active(REPO_SCAN_POLL_INTERVAL_MS)
        : false,
  });

  // 404: the BE does not ship the reviews endpoint yet — hide the history.
  const isUnavailable =
    (query.error as AxiosError | null)?.response?.status === 404;

  return { ...query, isUnavailable };
};
