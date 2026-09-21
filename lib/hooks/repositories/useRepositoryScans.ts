import { useQuery } from "@tanstack/react-query";

import { getRepositoryScans } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepositoryScans = (id: string) => {
  return useQuery({
    queryKey: repositoryKeys.scans(id),
    queryFn: () => getRepositoryScans(id),
    select: (response) => response.data ?? [],
    enabled: !!id,
  });
};
