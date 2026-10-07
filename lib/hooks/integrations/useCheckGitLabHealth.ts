import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  getIntegrationErrorMessage,
  upsertIntegration,
} from "@/lib/helpers/integration.helper";
import { toast } from "@/lib/toast";
import type { ApiResponse, ErrorResponse } from "@/lib/types/api.types";
import type { Integration } from "@/lib/types/integration.types";
import { getGitLabHealth } from "@/services/integrations.service";

import { integrationKeys } from "./queryKeys";

// A live call to GitLab — only ever triggered by an Admin click.
export const useCheckGitLabHealth = (orgId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => getGitLabHealth(orgId),
    onSuccess: (response) => {
      queryClient.setQueryData<ApiResponse<Integration[]>>(
        integrationKeys.list(orgId),
        (current) =>
          current && {
            ...current,
            data: upsertIntegration(current.data ?? [], response.data),
          },
      );
      if (response.data.state === "ACTIVE") {
        toast.success("GitLab connection is healthy");
      } else {
        toast.warning("GitLab connection needs attention");
      }
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      if (error.response?.status === 404) {
        queryClient.invalidateQueries({
          queryKey: integrationKeys.list(orgId),
        });
        toast.info("GitLab is no longer connected");
        return;
      }
      toast.error(
        getIntegrationErrorMessage(error.response?.status, error.message),
      );
    },
  });

  return {
    handleCheckGitLabHealth: mutation.mutate,
    isChecking: mutation.isPending,
  };
};
