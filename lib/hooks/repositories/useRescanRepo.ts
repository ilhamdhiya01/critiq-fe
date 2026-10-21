import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { RESCAN_RATE_LIMITED_MESSAGE } from "@/const/repository.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { formatRepoRescanResult } from "@/lib/helpers/repository.helper";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { rescanRepo } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRescanRepo = (orgId: string, repoId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => rescanRepo(orgId, repoId),
    onSuccess: (response) => {
      const message = formatRepoRescanResult(response.data);
      if (response.data.enqueued > 0) toast.success(message);
      else toast.info(message);
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.pulls(orgId, repoId),
      });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.repoScans(orgId, repoId),
      });
      queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      // 429: one re-scan per repo every 30s.
      if (getErrorCode(error) === "rescan_rate_limited") {
        toast.info(RESCAN_RATE_LIMITED_MESSAGE);
        return;
      }
      toast.error(
        error.response?.status === 403
          ? "Only Admins can re-scan pull requests"
          : error.message,
      );
    },
  });

  return {
    handleRescan: mutation.mutate,
    isRescanning: mutation.isPending,
  };
};
