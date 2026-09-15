import { useMutation, useQueryClient } from "@tanstack/react-query";

import { disconnectGitlab } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

export const useDisconnectGitlab = (orgId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => disconnectGitlab(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.candidates(orgId, "gitlab"),
      });
    },
  });

  return {
    handleDisconnectGitlab: mutation.mutateAsync,
  };
};
