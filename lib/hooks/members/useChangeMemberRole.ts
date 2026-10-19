import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { toast } from "@/lib/toast";
import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type { MemberRole, MembersData } from "@/lib/types/member.types";
import { changeMemberRole } from "@/services/members.service";

import { toMemberError } from "./memberError";
import { membersKeys } from "./queryKeys";

interface ChangeRoleInput {
  userId: string;
  role: MemberRole;
}

export const useChangeMemberRole = (orgId: string) => {
  const queryClient = useQueryClient();
  const key = membersKeys.list(orgId);

  const mutation = useMutation({
    mutationFn: ({ userId, role }: ChangeRoleInput) =>
      changeMemberRole(orgId, userId, role),
    // Show the new role right away; roll back if the BE refuses.
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiResponse<MembersData>>(key);
      queryClient.setQueryData<ApiResponse<MembersData>>(key, (current) =>
        current
          ? {
              ...current,
              data: {
                ...current.data,
                members: current.data.members.map((member) =>
                  member.userId === userId ? { ...member, role } : member,
                ),
              },
            }
          : current,
      );
      return { previous };
    },
    onError: (
      error: AxiosError<ErrorResponse>,
      _input,
      context?: { previous?: ApiResponse<MembersData> },
    ) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(toMemberError(error).message);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: membersKeys.org(orgId) }),
  });

  return {
    handleChangeRole: mutation.mutate,
    isChangingRole: mutation.isPending,
  };
};
