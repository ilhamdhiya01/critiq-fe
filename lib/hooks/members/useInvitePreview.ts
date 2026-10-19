import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getInvitePreview } from "@/services/members.service";

import { membersKeys } from "./queryKeys";

export const useInvitePreview = (token: string) => {
  const query = useQuery({
    queryKey: membersKeys.invite(token),
    queryFn: () => getInvitePreview(token),
    select: (response) => response.data,
    enabled: !!token,
    retry: false,
  });

  const isNotFound =
    (query.error as AxiosError | null)?.response?.status === 404;

  return { ...query, isNotFound };
};
