import { useQuery } from "@tanstack/react-query";

import { getRepositoryDetail } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepositoryDetail = (id: string) => {
  return useQuery({
    queryKey: repositoryKeys.detail(id),
    queryFn: () => getRepositoryDetail(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};
