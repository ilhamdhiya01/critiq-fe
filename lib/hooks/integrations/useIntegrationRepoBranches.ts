import { useQuery } from "@tanstack/react-query";

import type { IntegrationSource } from "@/lib/types/integration.types";
import { getIntegrationRepoBranches } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useIntegrationRepoBranches = (
  orgId: string,
  source: IntegrationSource,
  providerRepoId: number,
  enabled: boolean,
) =>
  useQuery({
    queryKey: integrationKeys.branches(orgId, source, providerRepoId),
    queryFn: () => getIntegrationRepoBranches(orgId, source, providerRepoId),
    select: (response) => response.data,
    enabled: enabled && !!orgId && !!providerRepoId,
    staleTime: 60_000,
    retry: false,
  });
