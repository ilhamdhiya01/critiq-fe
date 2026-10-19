import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import type { ErrorResponse } from "@/lib/types/api.types";
import type { InviteInput, InviteResult } from "@/lib/types/member.types";
import { inviteMember, resendInvite } from "@/services/members.service";

import { type MemberError, toMemberError } from "./memberError";
import { membersKeys } from "./queryKeys";

// Create or resend an invite. The returned link lives only in component
// state (never in the query cache) because the BE shows it just once.
export const useInviteMember = (orgId: string) => {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<InviteResult | null>(null);
  const [error, setError] = useState<MemberError | null>(null);

  const onSuccess = (response: { data: InviteResult }) => {
    setResult(response.data);
    queryClient.invalidateQueries({ queryKey: membersKeys.org(orgId) });
  };
  const onError = (caught: AxiosError<ErrorResponse>) =>
    setError(toMemberError(caught));

  const invite = useMutation({
    mutationFn: (input: InviteInput) => inviteMember(orgId, input),
    onMutate: () => setError(null),
    onSuccess,
    onError,
  });

  const resend = useMutation({
    mutationFn: (inviteId: string) => resendInvite(orgId, inviteId),
    onMutate: () => setError(null),
    onSuccess,
    onError,
  });

  const clearResult = useCallback(() => setResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    handleInvite: invite.mutateAsync,
    handleResend: resend.mutateAsync,
    isInviting: invite.isPending,
    isResending: resend.isPending,
    resendingId: resend.isPending ? resend.variables : undefined,
    inviteError: error,
    inviteResult: result,
    clearResult,
    clearError,
  };
};
