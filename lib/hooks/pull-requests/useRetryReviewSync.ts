import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { getErrorCode } from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type { PullRequestDetail } from "@/lib/types/pull-request.types";
import { retryReviewSync } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const useRetryReviewSync = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: pullRequestKeys.detail(orgId, repoId, id),
    });
    queryClient.invalidateQueries({
      queryKey: pullRequestKeys.reviews(orgId, repoId, id),
    });
  };

  const mutation = useMutation({
    mutationFn: (reviewId: string) =>
      retryReviewSync(orgId, repoId, id, reviewId),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiResponse<PullRequestDetail>>(
        pullRequestKeys.detail(orgId, repoId, id),
        (current) =>
          current && {
            ...current,
            data: {
              ...current.data,
              latestReview:
                current.data.latestReview?.id === response.data.id
                  ? response.data
                  : current.data.latestReview,
              reviewers: current.data.reviewers?.map((entry) =>
                entry.reviewId === response.data.id
                  ? {
                      ...entry,
                      sync: {
                        status: response.data.sync.status,
                        error: response.data.sync.error,
                      },
                    }
                  : entry,
              ),
            },
          },
      );
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.reviews(orgId, repoId, id),
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // Synced in the meantime — just show the current state.
      if (getErrorCode(error) === "already_synced") {
        refresh();
        return;
      }
      toast.error(error.response?.data?.message || error.message);
    },
  });

  return {
    handleRetrySync: mutation.mutate,
    isRetrying: mutation.isPending,
    // Which row's Retry is spinning.
    retryingReviewId: mutation.isPending ? mutation.variables : undefined,
  };
};
