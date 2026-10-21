import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { AI_IN_PROGRESS_MESSAGE } from "@/const/pull-request.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { scanPullRequest } from "@/services/pull-requests.service";

import { pullRequestKeys } from "./queryKeys";

export const useScanPullRequest = (
  orgId: string,
  repoId: string,
  id: string,
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => scanPullRequest(orgId, repoId, id),
    onSuccess: () => {
      toast.success("Scan started");
      // The detail now carries `activeScan` and polls until it finishes.
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.detail(orgId, repoId, id),
      });
      queryClient.invalidateQueries({
        queryKey: pullRequestKeys.summary(orgId, repoId, id),
      });
      queryClient.invalidateQueries({ queryKey: pullRequestKeys.list(orgId) });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.pulls(orgId, repoId),
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // 409 ai_in_progress: another tab/user started it first; refetch so the
      // button shows it is busy.
      if (getErrorCode(error) === "ai_in_progress") {
        queryClient.invalidateQueries({
          queryKey: pullRequestKeys.detail(orgId, repoId, id),
        });
        toast.info(AI_IN_PROGRESS_MESSAGE);
        return;
      }
      toast.error(
        error.response?.status === 403
          ? "Only Admins and Reviewers can scan pull requests"
          : error.response?.data?.message || error.message,
      );
    },
  });

  return {
    handleScanNow: mutation.mutateAsync,
    isStartingScan: mutation.isPending,
  };
};
