import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import {
  getIntegrationErrorMessage,
  type GitLabFieldErrors,
  toGitLabFieldErrors,
  upsertIntegration,
} from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type {
  Integration,
  VerifyGitLabTokenInput,
} from "@/lib/types/integration.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

// Connecting again with a new token replaces the stored one.
export const useConnectGitLab = (orgId: string) => {
  const queryClient = useQueryClient();
  const [connectFieldErrors, setConnectFieldErrors] =
    useState<GitLabFieldErrors>({});

  const mutation = useMutation({
    mutationFn: (input: VerifyGitLabTokenInput) =>
      verifyGitLabToken(orgId, input),
    gcTime: 0,
    onMutate: () => setConnectFieldErrors({}),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiResponse<Integration[]>>(
        integrationKeys.list(orgId),
        (current) =>
          current && {
            ...current,
            data: upsertIntegration(current.data ?? [], response.data),
          },
      );
      queryClient.invalidateQueries({
        queryKey: integrationKeys.candidates(orgId, "gitlab"),
      });
      toast.success("GitLab connected");
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const fieldErrors = toGitLabFieldErrors(
        error.response?.data?.errors ?? [],
      );
      if (Object.keys(fieldErrors).length > 0) {
        setConnectFieldErrors(fieldErrors);
        return;
      }
      toast.error(
        getIntegrationErrorMessage(error.response?.status, error.message),
      );
    },
  });

  const { mutateAsync, reset } = mutation;

  // The variables hold the access token; drop the mutation once it settles.
  const handleConnectGitLab = useCallback(
    async (input: VerifyGitLabTokenInput): Promise<boolean> => {
      try {
        await mutateAsync(input);
        return true;
      } catch {
        return false;
      } finally {
        reset();
      }
    },
    [mutateAsync, reset],
  );

  const clearConnectFieldErrors = useCallback(
    () => setConnectFieldErrors({}),
    [],
  );

  return {
    handleConnectGitLab,
    isConnecting: mutation.isPending,
    connectFieldErrors,
    clearConnectFieldErrors,
  };
};
