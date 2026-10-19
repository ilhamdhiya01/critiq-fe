import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { revokeInvite } from "@/services/members.service";

import { toMemberError } from "./memberError";
import { membersKeys } from "./queryKeys";

export const useRevokeInvite = (orgId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(orgId, inviteId),
    onSuccess: () => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({ queryKey: membersKeys.org(orgId) });
    },
    onError: (error: AxiosError<ErrorResponse>) =>
      toast.error(toMemberError(error).message),
  });

  return {
    handleRevoke: mutation.mutate,
    revokingId: mutation.isPending ? mutation.variables : undefined,
  };
};
