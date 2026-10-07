import { useQuery } from "@tanstack/react-query";

import { getAiSettings } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "./queryKeys";

export const useAiSettings = (orgId?: string) => {
  return useQuery({
    queryKey: aiSettingsKeys.detail(orgId ?? ""),
    queryFn: () => getAiSettings(orgId as string),
    select: (response) => response.data,
    enabled: !!orgId,
  });
};
