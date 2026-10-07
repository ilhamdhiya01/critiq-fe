import { useQuery } from "@tanstack/react-query";

import { countReposByProvider } from "@/lib/helpers/integration.helper";
import { getOrgRepositories } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

// Shares repositoryKeys.org with any future org repo list; only `select` differs.
export const useRepoCountByProvider = (orgId?: string) => {
  return useQuery({
    queryKey: repositoryKeys.org(orgId ?? ""),
    queryFn: () => getOrgRepositories(orgId as string),
    select: (response) => countReposByProvider(response.data ?? []),
    enabled: !!orgId,
  });
};
