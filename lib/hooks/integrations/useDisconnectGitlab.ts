import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getIntegrationErrorMessage } from "@/lib/helpers/integration.helper";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { disconnectGitlab } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useDisconnectGitlab = (orgId: string) => {
  const queryClient = useQueryClient();

  const refetchIntegrations = () => {
    queryClient.invalidateQueries({ queryKey: integrationKeys.list(orgId) });
    queryClient.invalidateQueries({
      queryKey: integrationKeys.candidates(orgId, "gitlab"),
    });
    queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
  };

  const mutation = useMutation({
    mutationFn: () => disconnectGitlab(orgId),
    onSuccess: refetchIntegrations,
    onError: (error: AxiosError<ErrorResponse>) => {
      // 404: already disconnected elsewhere — just resync the card.
      if (error.response?.status === 404) {
        refetchIntegrations();
        return;
      }
      toast.error(
        getIntegrationErrorMessage(error.response?.status, error.message),
      );
    },
  });

  return {
    handleDisconnectGitlab: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
  };
};
