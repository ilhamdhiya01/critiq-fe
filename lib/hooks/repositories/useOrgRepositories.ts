import { useQuery } from "@tanstack/react-query";

import { getOrgRepositories } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

// Same query as useRepoCountByProvider / useConnectedRepos; only `select` differs.
export const useOrgRepositories = (orgId?: string) => {
  return useQuery({
    queryKey: repositoryKeys.org(orgId ?? ""),
    queryFn: () => getOrgRepositories(orgId as string),
    select: (response) => response.data ?? [],
    enabled: !!orgId,
  });
};
