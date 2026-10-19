import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { OrgMember } from "@/lib/types/member.types";
import { ROUTES } from "@/routes";
import { removeMember } from "@/services/members.service";

import { toMemberError } from "./memberError";
import { membersKeys } from "./queryKeys";

export const useRemoveMember = (orgId: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (member: OrgMember) => removeMember(orgId, member.userId),
    onSuccess: (_response, member) => {
      if (member.isYou) {
        // Left this org: `/` picks another org or sends to onboarding.
        queryClient.invalidateQueries({
          queryKey: membershipWithOrgKeys.all,
        });
        router.replace(ROUTES.ROOT);
        return;
      }
      toast.success(`${member.name} was removed from the organization`);
      queryClient.invalidateQueries({ queryKey: membersKeys.org(orgId) });
    },
    onError: (error: AxiosError<ErrorResponse>) =>
      toast.error(toMemberError(error).message),
  });

  return {
    handleRemove: mutation.mutateAsync,
    isRemoving: mutation.isPending,
  };
};
