import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { VerifyGitLabTokenErrorCode } from "@/lib/types/integration.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

interface VerifyGitLabTokenErrorBody {
  error: VerifyGitLabTokenErrorCode;
}

export const useVerifyGitLabToken = (orgId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: { instanceUrl: string; token: string }) =>
      verifyGitLabToken(orgId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.candidates(orgId, "gitlab"),
      });
    },
  });

  const errorCode = (
    mutation.error as AxiosError<VerifyGitLabTokenErrorBody> | null
  )?.response?.data?.error;

  return {
    handleVerifyGitLabToken: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    verifyErrorCode: errorCode,
  };
};
