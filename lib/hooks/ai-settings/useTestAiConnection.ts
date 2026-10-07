import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useState } from "react";

import { toast } from "@/lib/toast";
import type {
  AiTestResult,
  TestAiConnectionInput,
} from "@/lib/types/ai-settings.types";
import type { ErrorResponse } from "@/lib/types/api.types";
import { testAiConnection } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "./queryKeys";

export type AiTestOutcome =
  { kind: "result"; result: AiTestResult } | { kind: "rate_limited" };

export const useTestAiConnection = (orgId: string) => {
  const queryClient = useQueryClient();
  const [testOutcome, setTestOutcome] = useState<AiTestOutcome | null>(null);

  const mutation = useMutation({
    mutationFn: (input: TestAiConnectionInput) =>
      testAiConnection(orgId, input),
    gcTime: 0,
    onSuccess: (response) =>
      setTestOutcome({ kind: "result", result: response.data }),
    onError: (error: AxiosError<ErrorResponse>) => {
      if (error.response?.status === 429) {
        setTestOutcome({ kind: "rate_limited" });
        return;
      }
      setTestOutcome(null);
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: aiSettingsKeys.detail(orgId),
      });
    },
  });

  const { mutateAsync, reset } = mutation;

  // Same as saving: the request may carry an unsaved API key, so the
  // mutation is dropped once it settles and the outcome lives in local state.
  const handleTestAiConnection = useCallback(
    async (input: TestAiConnectionInput) => {
      try {
        await mutateAsync(input);
      } catch {
        // Surfaced through testOutcome or a toast in onError.
      } finally {
        reset();
      }
    },
    [mutateAsync, reset],
  );

  return {
    handleTestAiConnection,
    isTesting: mutation.isPending,
    testOutcome,
  };
};
