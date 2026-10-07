import { useQuery } from "@tanstack/react-query";

import { splitIntegrations } from "@/lib/helpers/integration.helper";
import { getIntegrations } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useIntegrations = (orgId?: string) => {
  return useQuery({
    queryKey: integrationKeys.list(orgId ?? ""),
    queryFn: () => getIntegrations(orgId as string),
    select: (response) => splitIntegrations(response.data ?? []),
    enabled: !!orgId,
  });
};
