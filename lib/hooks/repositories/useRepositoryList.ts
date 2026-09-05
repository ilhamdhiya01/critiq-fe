import { useQuery } from "@tanstack/react-query";

import { getRepositories } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRepositoryList = () => {
  return useQuery({
    queryKey: repositoryKeys.lists(),
    queryFn: getRepositories,
    select: (response) => response.data ?? [],
  });
};
