import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useMemo, useState } from "react";

import { AI_MODELS_DEBOUNCE_MS } from "@/const/ai-settings.constant";
import { toFieldErrors } from "@/lib/helpers/ai-settings.helper";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type {
  AiProviderId,
  AiProviderOption,
} from "@/lib/types/ai-settings.types";
import type { ErrorResponse } from "@/lib/types/api.types";
import { listAiModels } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "./queryKeys";

interface UseAiModelsParams {
  option: AiProviderOption | undefined;
  apiKey: string;
  baseUrl: string;
  storedBaseUrl: string;
}

export const useAiModels = (
  orgId: string,
  { option, apiKey, baseUrl, storedBaseUrl }: UseAiModelsParams,
) => {
  const provider: AiProviderId | null = option?.available ? option.id : null;
  const needsBaseUrl = !!option?.needsBaseUrl;

  const typed = useMemo(
    () => ({ provider, apiKey, baseUrl }),
    [provider, apiKey, baseUrl],
  );
  const debounced = useDebounce(typed, AI_MODELS_DEBOUNCE_MS);
  // Switching provider fetches right away; only typing is debounced.
  const effective = debounced.provider === provider ? debounced : typed;

  // Each distinct typed key gets a new version so the preview refetches,
  // without the key itself ever entering the query cache.
  const [keyTracker, setKeyTracker] = useState({
    apiKey: effective.apiKey,
    version: 0,
  });
  if (keyTracker.apiKey !== effective.apiKey) {
    setKeyTracker({
      apiKey: effective.apiKey,
      version: keyTracker.version + 1,
    });
  }

  const previewKey = effective.apiKey || undefined;
  const previewBaseUrl =
    needsBaseUrl && effective.baseUrl !== storedBaseUrl
      ? effective.baseUrl
      : undefined;

  const query = useQuery({
    queryKey: aiSettingsKeys.modelList(
      orgId,
      provider ?? "anthropic",
      previewBaseUrl ?? null,
      previewKey ? keyTracker.version : 0,
    ),
    queryFn: () =>
      listAiModels(orgId, {
        provider: provider as AiProviderId,
        apiKey: previewKey,
        baseUrl: previewBaseUrl,
      }),
    select: (response) => response.data,
    enabled: !!orgId && !!provider && !(needsBaseUrl && !effective.baseUrl),
    gcTime: previewKey ? 0 : undefined,
  });

  const modelsError = query.error as AxiosError<ErrorResponse> | null;

  const modelsFieldErrors = useMemo(
    () => toFieldErrors(modelsError?.response?.data?.errors ?? []),
    [modelsError],
  );

  const hasFieldError = Object.keys(modelsFieldErrors).length > 0;

  return {
    modelList: query.data,
    isLoadingModels: query.isLoading,
    modelsFieldErrors,
    modelsErrorMessage:
      modelsError && !hasFieldError ? modelsError.message : null,
  };
};
