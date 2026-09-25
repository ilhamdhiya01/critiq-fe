import { useQuery } from "@tanstack/react-query";

import { getUser } from "@/services/auth.service";

import { userKeys } from "./queryKeys";

export const useUser = () => {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => getUser(),
    select: (response) => response.data,
    staleTime: Infinity,
    retry: false,
  });
};
