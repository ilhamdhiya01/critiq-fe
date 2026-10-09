import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { rescanRepo } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

export const useRescanRepo = (orgId: string, repoId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => rescanRepo(orgId, repoId),
    onSuccess: () => {
      toast.success("Re-scan started for open pull requests");
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.pulls(orgId, repoId),
      });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.repoScans(orgId, repoId),
      });
      queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
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
