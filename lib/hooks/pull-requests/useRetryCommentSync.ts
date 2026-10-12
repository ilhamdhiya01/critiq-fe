import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getErrorCode } from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { retryCommentSync } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

// Synced or already being retried elsewhere — just show the current state.
const SETTLED_CODES = new Set(["already_synced", "sync_in_progress"]);

export const useRetryCommentSync = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: pullRequestKeys.comments(orgId, repoId, id),
    });

  const mutation = useMutation({
    mutationFn: (commentId: string) =>
      retryCommentSync(orgId, repoId, id, commentId),
    onSuccess: refresh,
    onError: (error: AxiosError<ErrorResponse>) => {
      if (SETTLED_CODES.has(getErrorCode(error) ?? "")) {
        refresh();
        return;
      }
      toast.error(error.response?.data?.message || error.message);
    },
  });

  return {
    handleRetryCommentSync: mutation.mutate,
    isRetryingSync: mutation.isPending,
  };
};
