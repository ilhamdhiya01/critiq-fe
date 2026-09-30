import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { IntegrationSource } from "@/lib/types/integration.types";
import { getIntegrationRepoBranches } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useIntegrationRepoBranches = (
  orgId: string,
  source: IntegrationSource,
  providerRepoId: number,
  enabled: boolean,
  search: string,
) =>
  useQuery({
    queryKey: integrationKeys.branches(orgId, source, providerRepoId, search),
    queryFn: ({ signal }) =>
      getIntegrationRepoBranches(orgId, source, providerRepoId, {
        search,
        signal,
      }),
    select: (response) => response.data,
    enabled: enabled && !!orgId && !!providerRepoId,
    staleTime: 60_000,
    retry: false,
    // Keeps the previous branch list on screen while a new search term is
    // fetching — without this, `data` briefly clears between keystrokes
    // (and a cancelled in-flight request surfaces as an error), which reads
    // as the dropdown closing.
    placeholderData: keepPreviousData,
  });
