import { useQuery } from "@tanstack/react-query";

import { getScanConfig } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useScanConfig = (orgId: string | undefined, repoId: string) => {
  return useQuery({
    queryKey: repositoryKeys.scanConfig(orgId ?? "", repoId),
    queryFn: () => getScanConfig(orgId as string, repoId),
    select: (response) => response.data,
    enabled: !!orgId && !!repoId,
  });
};
