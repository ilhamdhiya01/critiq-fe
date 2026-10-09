import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getRepoBranches } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepoBranches = (
  orgId: string,
  repoId: string,
  search: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: repositoryKeys.branches(orgId, repoId, search),
    queryFn: ({ signal }) => getRepoBranches(orgId, repoId, { search, signal }),
    select: (response) => response.data,
    enabled: enabled && !!orgId && !!repoId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });
};
