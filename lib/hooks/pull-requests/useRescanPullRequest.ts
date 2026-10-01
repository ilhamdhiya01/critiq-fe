import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";
import { regeneratePullRequestSummary } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const useRegeneratePullRequestSummary = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => regeneratePullRequestSummary(orgId, repoId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.summary(orgId, repoId, id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    handleRegenerate: mutation.mutateAsync,
    isRegenerating: mutation.isPending,
  };
};
