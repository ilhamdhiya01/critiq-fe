import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { ErrorResponse } from "@/lib/types/api.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

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

  const fieldErrors =
    (mutation.error as AxiosError<ErrorResponse> | null)?.response?.data
      ?.errors ?? [];

  return {
    handleVerifyGitLabToken: mutation.mutateAsync,
    isVerifying: mutation.isPending,
    verifyFieldErrors: fieldErrors,
  };
};
