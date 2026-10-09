import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import {
  PROVIDER_ACCESS_ERROR_MESSAGE,
  SCAN_CONFIG_FORBIDDEN_MESSAGE,
} from "@/const/repository.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import {
  mapScanConfigErrors,
  type ScanConfigErrors,
} from "@/lib/helpers/scan-config.helper";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import type {
  BranchPolicyEntry,
  UpdateScanConfigInput,
} from "@/lib/types/repository.types";
import { updateScanConfig } from "@/services/repositories.service";

import { repositoryKeys } from "./queryKeys";

const NO_ERRORS: ScanConfigErrors = { rowErrors: {}, formError: null };

export const useUpdateScanConfig = (orgId: string, repoId: string) => {
  const queryClient = useQueryClient();
  const [saveErrors, setSaveErrors] = useState<ScanConfigErrors>(NO_ERRORS);

  const mutation = useMutation({
    mutationFn: (input: UpdateScanConfigInput) =>
      updateScanConfig(orgId, repoId, input),
    onSuccess: (response) => {
      // The PUT answers with the GET shape — no refetch needed.
      queryClient.setQueryData(
        repositoryKeys.scanConfig(orgId, repoId),
        response,
      );
      queryClient.invalidateQueries({ queryKey: repositoryKeys.org(orgId) });
      toast.success("Review policies saved");
    },
  });

  const { mutateAsync, reset } = mutation;

  const handleSaveScanConfig = useCallback(
    async (
      input: UpdateScanConfigInput,
      sentRows: BranchPolicyEntry[],
    ): Promise<boolean> => {
      setSaveErrors(NO_ERRORS);
      try {
        await mutateAsync(input);
        return true;
      } catch (caught) {
        const error = caught as AxiosError<ErrorResponse>;
        const status = error.response?.status;
        // New branches are checked against the provider; 409 = unreachable.
        const providerMessage =
          status === 409
            ? PROVIDER_ACCESS_ERROR_MESSAGE[getErrorCode(error) ?? ""]
            : undefined;
        if (status === 403) {
          setSaveErrors({
            rowErrors: {},
            formError: SCAN_CONFIG_FORBIDDEN_MESSAGE,
          });
        } else if (providerMessage) {
          setSaveErrors({ rowErrors: {}, formError: providerMessage });
        } else if (status === 422 || status === 400) {
          const mapped = mapScanConfigErrors(
            error.response?.data?.errors ?? [],
            sentRows,
          );
          setSaveErrors(
            Object.keys(mapped.rowErrors).length > 0 || mapped.formError
              ? mapped
              : { rowErrors: {}, formError: error.message },
          );
        } else {
          toast.error(error.message);
        }
        return false;
      } finally {
        reset();
      }
    },
    [mutateAsync, reset],
  );

  const clearSaveErrors = useCallback(() => setSaveErrors(NO_ERRORS), []);

  return {
    handleSaveScanConfig,
    isSaving: mutation.isPending,
    saveErrors,
    clearSaveErrors,
  };
};
