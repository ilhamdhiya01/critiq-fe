import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getRepoScans } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepoScans = (orgId: string, repoId: string) => {
  const query = useQuery({
    queryKey: repositoryKeys.repoScans(orgId, repoId),
    queryFn: () => getRepoScans(orgId, repoId),
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId,
    retry: false,
  });

  // 404: the BE does not ship the scans endpoint yet — hide the section.
  const isUnavailable =
    (query.error as AxiosError | null)?.response?.status === 404;

  return { ...query, isUnavailable };
};
