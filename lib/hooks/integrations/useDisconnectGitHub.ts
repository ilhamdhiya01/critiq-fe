import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { GITHUB_UNREACHABLE_MESSAGE } from "@/const/integration.constant";
import { getIntegrationErrorMessage } from "@/lib/helpers/integration.helper";
import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { disconnectGitHub } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useDisconnectGitHub = (orgId: string) => {
  const queryClient = useQueryClient();

  // The BE deletes the integration plus every GitHub repo, PR and scan.
  const refetchAfterRemoval = () => {
    queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
    queryClient.invalidateQueries({ queryKey: repositoryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: pullRequestKeys.all });
  };

  const mutation = useMutation({
    mutationFn: () => disconnectGitHub(orgId),
    onSuccess: () => {
      refetchAfterRemoval();
      toast.success("GitHub disconnected");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const status = error.response?.status;
      // 404: already gone — resync the card as if it succeeded.
      if (status === 404) {
        refetchAfterRemoval();
        return;
      }
      // 502: GitHub unreachable, nothing was deleted.
      if (status === 502) {
        toast.error(GITHUB_UNREACHABLE_MESSAGE);
        return;
      }
      toast.error(getIntegrationErrorMessage(status, error.message));
    },
  });

  return {
    handleDisconnectGitHub: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
  };
};
