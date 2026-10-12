import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import { COMMENT_ERROR_MESSAGE } from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { CreateCommentInput } from "@/lib/types/pull-request.types";
import { createPullRequestComment } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

// One instance per form, so each keeps its own pending/error state.
export const useCreateComment = (orgId: string, repoId: string, id: string) => {
  const queryClient = useQueryClient();
  const [createError, setCreateError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: CreateCommentInput) =>
      createPullRequestComment(orgId, repoId, id, input),
    onMutate: () => setCreateError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.comments(orgId, repoId, id),
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const code = getErrorCode(error) ?? "";

      // An inline comment on a commit that is no longer the head: reload the
      // diff so the reviewer comments on the current lines.
      if (code === "head_changed") {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.detail(orgId, repoId, id),
        });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.diff(orgId, repoId, id),
        });
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.comments(orgId, repoId, id),
        });
      }

      setCreateError(
        error.response?.status === 403
          ? COMMENT_ERROR_MESSAGE.forbidden
          : (COMMENT_ERROR_MESSAGE[code] ??
              error.response?.data?.message ??
              error.message),
      );
    },
  });

  const clearCreateError = useCallback(() => setCreateError(null), []);

  return {
    handleCreateComment: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError,
    clearCreateError,
  };
};
