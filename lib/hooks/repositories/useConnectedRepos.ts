import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { ApiResponse } from "@/lib/types/api.types";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type { OrgRepository } from "@/lib/types/repository.types";
import { getOrgRepositories } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

// Same query as useRepoCountByProvider; `select` keeps one provider's repos as
// path → Critiq repo id, so candidates can be marked as connected and linked
// to their settings page.
export const useConnectedRepos = (
  orgId: string,
  provider: IntegrationProvider,
) => {
  const select = useCallback(
    (response: ApiResponse<OrgRepository[]>) =>
      new Map(
        (response.data ?? [])
          .filter((repo) => repo.provider === provider)
          .map((repo) => [repo.path, repo.id] as const),
      ),
    [provider],
  );

  return useQuery({
    queryKey: repositoryKeys.org(orgId),
    queryFn: () => getOrgRepositories(orgId),
    select,
    enabled: !!orgId,
  });
};
