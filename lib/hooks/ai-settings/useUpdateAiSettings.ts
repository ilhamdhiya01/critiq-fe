import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import { AI_SETTINGS_ERROR_MESSAGE } from "@/const/ai-settings.constant";
import { toFieldErrors } from "@/lib/helpers/ai-settings.helper";
import { toast } from "@/lib/toast";
import type {
  AiFieldErrors,
  AiSettingsErrorCode,
  UpdateAiSettingsInput,
} from "@/lib/types/ai-settings.types";
import type { ErrorResponse } from "@/lib/types/api.types";
import { updateAiSettings } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "./queryKeys";

export const useUpdateAiSettings = (orgId: string) => {
  const queryClient = useQueryClient();
  const [saveFieldErrors, setSaveFieldErrors] = useState<AiFieldErrors>({});

  const mutation = useMutation({
    mutationFn: (input: UpdateAiSettingsInput) =>
      updateAiSettings(orgId, input),
    gcTime: 0,
    onMutate: () => setSaveFieldErrors({}),
    onSuccess: (response) => {
      queryClient.setQueryData(aiSettingsKeys.detail(orgId), response);
      queryClient.invalidateQueries({
        queryKey: aiSettingsKeys.models(orgId),
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const fieldErrors = toFieldErrors(error.response?.data?.errors ?? []);
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
        return;
      }
      toast.error(
        AI_SETTINGS_ERROR_MESSAGE[error.message as AiSettingsErrorCode] ??
          error.message,
      );
    },
  });

  const { mutateAsync, reset } = mutation;

  // The mutation's variables can hold a freshly typed API key; drop them from
  // the mutation cache as soon as the request settles.
  const handleUpdateAiSettings = useCallback(
    async (input: UpdateAiSettingsInput) => {
      try {
        return await mutateAsync(input);
      } finally {
        reset();
      }
    },
    [mutateAsync, reset],
  );

  const clearSaveFieldErrors = useCallback(() => setSaveFieldErrors({}), []);

  return {
    handleUpdateAiSettings,
    isSaving: mutation.isPending,
    saveFieldErrors,
    clearSaveFieldErrors,
  };
};
