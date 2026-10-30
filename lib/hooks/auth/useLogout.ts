import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { clearPendingInvite } from "@/lib/helpers/invite.helper";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { logout } from "@/services/auth.service";

// Ends the session on the BE, then drops every cached query and any pending
// invite so nothing from the old account lingers. Callers decide where to go
// next (the invite page stores its token again after "Not you?").
export const useLogout = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      clearPendingInvite();
    },
    onError: (error: AxiosError<ErrorResponse>) =>
      toast.error(error.response?.data?.message || error.message),
  });

  return {
    handleLogout: mutation.mutateAsync,
    isLoggingOut: mutation.isPending,
  };
};
