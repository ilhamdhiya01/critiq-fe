import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { logout } from "@/services/auth.service";

// Ends the session on the BE, then drops every cached query so nothing from
// the old account lingers. Callers decide where to go next.
export const useLogout = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.clear(),
    onError: (error: AxiosError<ErrorResponse>) =>
      toast.error(error.response?.data?.message || error.message),
  });

  return {
    handleLogout: mutation.mutateAsync,
    isLoggingOut: mutation.isPending,
  };
};
