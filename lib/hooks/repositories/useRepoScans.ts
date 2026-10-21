import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { REPO_SCAN_POLL_INTERVAL_MS } from "@/const/repository.constant";
import { isScanInProgress } from "@/lib/helpers/scan-status.helper";
import { useLivePollInterval } from "@/lib/hooks/useLivePollInterval";
import { getRepoScans } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepoScans = (orgId: string, repoId: string) => {
  const poll = useLivePollInterval();
  const query = useQuery({
    queryKey: repositoryKeys.repoScans(orgId, repoId),
    queryFn: () => getRepoScans(orgId, repoId),
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId,
    retry: false,
    // Fallback when realtime is down: keeps queued/running rows and those
    // still in AI review moving without a reload.
    refetchInterval: (query) =>
      query.state.data?.data?.some(isScanInProgress)
        ? poll.active(REPO_SCAN_POLL_INTERVAL_MS)
        : false,
  });

  // 404: the BE does not ship the scans endpoint yet — hide the section.
  const isUnavailable =
    (query.error as AxiosError | null)?.response?.status === 404;

  return { ...query, isUnavailable };
};
