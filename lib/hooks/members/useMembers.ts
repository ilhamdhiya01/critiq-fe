import { useQuery } from "@tanstack/react-query";

import { getMembers } from "@/services/members.service";

import { membersKeys } from "./queryKeys";

export const useMembers = (orgId: string | undefined) => {
  return useQuery({
    queryKey: membersKeys.list(orgId ?? ""),
    queryFn: () => getMembers(orgId as string),
    select: (response) => response.data,
    enabled: !!orgId,
  });
};
