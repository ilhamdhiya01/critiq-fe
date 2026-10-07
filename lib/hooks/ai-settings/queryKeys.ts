import type { AiProviderId } from "@/lib/types/ai-settings.types";

// Never put an API key in a query key — the query cache is global state.
// Typed keys are represented by a local counter (`keyVersion`) instead.
export const aiSettingsKeys = {
  all: ["ai-settings"] as const,
  detail: (orgId: string) => [...aiSettingsKeys.all, "detail", orgId] as const,
  models: (orgId: string) => [...aiSettingsKeys.all, "models", orgId] as const,
  modelList: (
    orgId: string,
    provider: AiProviderId,
    baseUrl: string | null,
    keyVersion: number,
  ) =>
    [...aiSettingsKeys.models(orgId), provider, baseUrl, keyVersion] as const,
};
