import { useQuery } from "@tanstack/react-query";

import { getOrgRules } from "@/services/rules.service";

import { rulesKeys } from "./queryKeys";

export const useOrgRules = (orgId: string | undefined) => {
  return useQuery({
    queryKey: rulesKeys.org(orgId ?? ""),
    queryFn: () => getOrgRules(orgId as string),
    select: (response) => response.data,
    enabled: !!orgId,
  });
};
