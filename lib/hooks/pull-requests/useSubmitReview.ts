import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import {
  REVIEW_ALREADY_MESSAGE,
  REVIEW_DECISION_LABEL,
  REVIEW_ERROR_MESSAGE,
} from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type {
  PullRequestDetail,
  PullRequestReview,
  SubmitReviewInput,
} from "@/lib/types/pull-request.types";
import { submitPullRequestReview } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

// The PR moved on (new commit, closed, scan/AI state): refetch so the page
// shows what the BE checked against.
const REFRESH_DETAIL_CODES = new Set([
  "head_changed",
  "pull_not_open",
  "scan_required",
  "ai_analysis_required",
]);

export const useSubmitReview = (orgId: string, repoId: string, id: string) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: SubmitReviewInput) =>
      submitPullRequestReview(orgId, repoId, id, input),
    onMutate: () => setSubmitError(null),
    onSuccess: (response) => {
      // Show "Syncing…" right away; the detail then polls until it settles.
      queryClient.setQueryData<ApiResponse<PullRequestDetail>>(
        pullRequestKeys.detail(orgId, repoId, id),
        (current) =>
          current && {
            ...current,
            data: { ...current.data, latestReview: response.data },
          },
      );
      // Newest first: my decision shows in the panel before the refetch.
      queryClient.setQueryData<ApiResponse<PullRequestReview[]>>(
        pullRequestKeys.reviews(orgId, repoId, id),
        (current) =>
          current && {
            ...current,
            data: [response.data, ...(current.data ?? [])],
          },
      );
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.reviews(orgId, repoId, id),
      });
      queryClient.invalidateQueries({ queryKey: pullRequestKeys.list(orgId) });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.pulls(orgId, repoId),
      });
      toast.success(REVIEW_DECISION_LABEL[response.data.decision]);
    },
    onError: (error: AxiosError<ErrorResponse>, input) => {
      const code = getErrorCode(error) ?? "";

      // Same decision already recorded on this commit (e.g. another tab):
      // refetch so the panel shows it instead of a generic error.
      if (code === "already_reviewed") {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.reviews(orgId, repoId, id),
        });
        setSubmitError(REVIEW_ALREADY_MESSAGE[input.decision]);
        return;
      }

      if (REFRESH_DETAIL_CODES.has(code)) {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.detail(orgId, repoId, id),
        });
      }
      if (code === "head_changed") {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.diff(orgId, repoId, id),
        });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.summary(orgId, repoId, id),
        });
      }

      setSubmitError(
        error.response?.status === 403
          ? REVIEW_ERROR_MESSAGE.forbidden
          : (REVIEW_ERROR_MESSAGE[code] ??
              error.response?.data?.message ??
              error.message),
      );
    },
  });

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  return {
    handleSubmitReview: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    submitError,
    clearSubmitError,
  };
};
