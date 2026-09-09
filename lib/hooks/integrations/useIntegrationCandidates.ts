import { useQuery } from "@tanstack/react-query";

import type { IntegrationSource } from "@/lib/types/integration.types";
import { getIntegrationCandidates } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useIntegrationCandidates = (
  orgId: string,
  source: IntegrationSource,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: integrationKeys.candidates(orgId, source),
    queryFn: () => getIntegrationCandidates(orgId, source),
    select: (response) => response.data ?? [],
    enabled,
  });
};
