import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { INVITE_ACCEPT_ERROR_STATUS } from "@/const/member.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { clearPendingInvite } from "@/lib/helpers/invite.helper";
import { userKeys } from "@/lib/hooks/auth/queryKeys";
import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { InvitePreviewStatus } from "@/lib/types/member.types";
import { ROUTES } from "@/routes";
import { acceptInvite } from "@/services/members.service";

export const useAcceptInvite = (token: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  // A 410 turns the page into the matching terminal state.
  const [failedStatus, setFailedStatus] = useState<Exclude<
    InvitePreviewStatus,
    "pending"
  > | null>(null);
  // The signed-in account is already in the org. The invite stays valid for
  // the real recipient, so the pending token is kept until the user chooses.
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  const mutation = useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: (response) => {
      clearPendingInvite();
      // The BE re-issued the session with this org active.
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: membershipWithOrgKeys.all });
      router.replace(ROUTES.dashboard(response.data.organization.slug));
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const code = getErrorCode(error) ?? "";
      if (code === "already_member") {
        setIsAlreadyMember(true);
        return;
      }
      const status = INVITE_ACCEPT_ERROR_STATUS[code];
      if (status) {
        clearPendingInvite();
        setFailedStatus(status);
        return;
      }
      toast.error(error.response?.data?.message || error.message);
    },
  });

  return {
    handleAccept: mutation.mutate,
    isAccepting: mutation.isPending,
    failedStatus,
    isAlreadyMember,
  };
};
