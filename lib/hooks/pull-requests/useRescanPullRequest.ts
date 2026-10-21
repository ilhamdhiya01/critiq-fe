import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { AI_IN_PROGRESS_MESSAGE } from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
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
      // Covers a regenerate that finishes without passing through
      // queued/running (e.g. a cached result).
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.detail(orgId, repoId, id),
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // 412: the org's AI setup changed between loading the summary and the
      // click — refetch so the card shows what is missing now.
      if (error.response?.status === 412) {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.summary(orgId, repoId, id),
        });
        toast.info("AI setup changed — the summary has been refreshed.");
        return;
      }
      // 409 ai_in_progress: the AI review is still running (another tab or
      // user); refetch so the buttons show it is busy.
      if (getErrorCode(error) === "ai_in_progress") {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.detail(orgId, repoId, id),
        });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.summary(orgId, repoId, id),
        });
        toast.info(AI_IN_PROGRESS_MESSAGE);
        return;
      }
      toast.error(error.message);
    },
  });

  return {
    handleRegenerate: mutation.mutateAsync,
    isRegenerating: mutation.isPending,
  };
};
