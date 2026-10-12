import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import {
  getMergeErrorMessage,
  isMergeBlockerCode,
} from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { MergePullRequestInput } from "@/lib/types/pull-request.types";
import { mergePullRequest } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const useMergePullRequest = (
  orgId: string,
  repoId: string,
  id: string,
  {
    providerName,
    targetBranch,
  }: { providerName: string; targetBranch: string },
) => {
  const queryClient = useQueryClient();
  const [mergeError, setMergeError] = useState<string | null>(null);

  const invalidate = (key: readonly unknown[]) =>
    queryClient.invalidateQueries({ queryKey: key });

  const mutation = useMutation({
    mutationFn: (input: MergePullRequestInput) =>
      mergePullRequest(orgId, repoId, id, input),
    onMutate: () => setMergeError(null),
    onSuccess: () => {
      // The refetched detail is MERGED, which hides the review/merge panel.
      invalidate(pullRequestKeys.detail(orgId, repoId, id));
      invalidate(pullRequestKeys.list(orgId));
      invalidate(pullRequestKeys.reviews(orgId, repoId, id));
      invalidate(repositoryKeys.pulls(orgId, repoId));
      toast.success(`Merged into ${targetBranch}`);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const code = getErrorCode(error) ?? "";

      // New commit or a blocker the page didn't know about: show the BE's
      // current view of the PR.
      if (code === "head_changed" || isMergeBlockerCode(code)) {
        invalidate(pullRequestKeys.detail(orgId, repoId, id));
      }
      if (code === "head_changed") {
        invalidate(pullRequestKeys.diff(orgId, repoId, id));
        invalidate(pullRequestKeys.summary(orgId, repoId, id));
      }

      // The provider refused (conflict, required checks, draft…): its own
      // explanation is the most useful thing to show.
      const providerDetail =
        code === "not_mergeable" ? error.response?.data?.detail : undefined;

      setMergeError(
        providerDetail ??
          getMergeErrorMessage(code, providerName) ??
          error.response?.data?.message ??
          error.message,
      );
    },
  });

  const clearMergeError = useCallback(() => setMergeError(null), []);

  return {
    handleMerge: mutation.mutateAsync,
    isMerging: mutation.isPending,
    mergeError,
    clearMergeError,
  };
};
