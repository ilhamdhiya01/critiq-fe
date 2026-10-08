import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { ApiResponse } from "@/lib/types/api.types";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type { OrgRepository } from "@/lib/types/repository.types";
import { getOrgRepositories } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

// Same query as useRepoCountByProvider; `select` keeps only the paths of one
// provider so candidates can be marked as already connected.
export const useConnectedRepoPaths = (
  orgId: string,
  provider: IntegrationProvider,
) => {
  const select = useCallback(
    (response: ApiResponse<OrgRepository[]>) =>
      new Set(
        (response.data ?? [])
          .filter((repo) => repo.provider === provider)
          .map((repo) => repo.path),
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
