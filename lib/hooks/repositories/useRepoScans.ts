import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  ACTIVE_REPO_SCAN_STATUSES,
  REPO_SCAN_POLL_INTERVAL_MS,
} from "@/const/repository.constant";
import { getRepoScans } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepoScans = (orgId: string, repoId: string) => {
  const query = useQuery({
    queryKey: repositoryKeys.repoScans(orgId, repoId),
    queryFn: () => getRepoScans(orgId, repoId),
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId,
    retry: false,
    // Keeps "Scanning…" rows moving to Done/Failed without a reload.
    refetchInterval: (query) =>
      query.state.data?.data?.some((scan) =>
        ACTIVE_REPO_SCAN_STATUSES.has(scan.status),
      )
        ? REPO_SCAN_POLL_INTERVAL_MS
        : false,
  });

  // 404: the BE does not ship the scans endpoint yet — hide the section.
  const isUnavailable =
    (query.error as AxiosError | null)?.response?.status === 404;

  return { ...query, isUnavailable };
};
