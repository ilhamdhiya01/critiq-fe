import { useQuery } from "@tanstack/react-query";

import { isKnownRuleTier } from "@/const/rules.constant";
import { getOrgRules } from "@/services/rules.service";

import { rulesKeys } from "./queryKeys";

export const useOrgRules = (orgId: string | undefined) => {
  return useQuery({
    queryKey: rulesKeys.org(orgId ?? ""),
    queryFn: () => getOrgRules(orgId as string),
    // Drop tiers this FE no longer knows (the removed "ci" tier on older BE).
    select: (response) => ({
      ...response.data,
      tiers: response.data.tiers.filter((tier) => isKnownRuleTier(tier.id)),
    }),
    enabled: !!orgId,
  });
};
