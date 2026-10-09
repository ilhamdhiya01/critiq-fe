import { useQuery } from "@tanstack/react-query";

import { getRepoPulls } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepoPulls = (orgId: string, repoId: string) => {
  return useQuery({
    queryKey: repositoryKeys.pulls(orgId, repoId),
    queryFn: () => getRepoPulls(orgId, repoId),
    select: (response) => response.data ?? [],
    enabled: !!orgId && !!repoId,
  });
};
