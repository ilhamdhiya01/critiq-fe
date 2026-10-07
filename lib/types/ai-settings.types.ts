export type AiProviderId =
  "anthropic" | "openai" | "openai_compatible" | "google";

export type AiLocale = "id" | "en";

export interface AiProviderOption {
  id: AiProviderId;
  label: string;
  available: boolean;
  defaultModel?: string | null;
  models?: string[];
  needsBaseUrl?: boolean;
  keyOptional?: boolean;
}

export interface AiCredentialStatus {
  hasKey: boolean;
  last4?: string;
  baseUrl?: string;
}

export type AiConsent =
  | { granted: false }
  | { granted: true; at: string; by: { id: string; name: string } };

export type AiStructuredOutput = "native" | "json_mode" | "failed";

export interface AiLastTest {
  at: string;
  ok: boolean;
  latencyMs: number;
  structuredOutput: AiStructuredOutput;
  model: string | null;
}

export interface AiSettingsAdmin {
  provider: AiProviderId | null;
  model: string | null;
  baseUrl: string | null;
  credentials: Partial<Record<AiProviderId, AiCredentialStatus>>;
  consent: AiConsent;
  locale: AiLocale;
  dailyTokenBudget: number;
  providers: AiProviderOption[];
  lastTest: AiLastTest | null;
}

// Reviewer/Viewer receive only this subset — no credentials, no provider list.
export interface AiSettingsMember {
  provider: AiProviderId | null;
  model: string | null;
  consent: { granted: boolean };
  locale: AiLocale;
}

export type AiSettings = AiSettingsAdmin | AiSettingsMember;

// apiKey: string = store new key, "" = delete the key, omitted = keep it.
export interface UpdateAiSettingsInput {
  provider?: AiProviderId;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  consent?: boolean;
  locale?: AiLocale;
  dailyTokenBudget?: number;
}

export type AiSettingsErrorCode =
  | "api_key_required"
  | "base_url_required"
  | "insecure_base_url"
  | "provider_unavailable"
  | "budget_min"
  | "model_required";

export type AiSettingsField =
  | "provider"
  | "model"
  | "baseUrl"
  | "apiKey"
  | "consent"
  | "locale"
  | "dailyTokenBudget";

export type AiFieldErrors = Partial<Record<AiSettingsField, string>>;

// The API key is deliberately not part of the form values: it is never
// prefilled and lives in its own local state.
export interface AiFormValues {
  provider: AiProviderId | null;
  model: string;
  baseUrl: string;
  consent: boolean;
  locale: AiLocale;
  dailyTokenBudget: number;
}

export interface TestAiConnectionInput {
  provider?: AiProviderId;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

export type AiTestErrorCode =
  | "auth_failed"
  | "rate_limited"
  | "timeout"
  | "provider_unreachable"
  | "invalid_response"
  | "output_truncated"
  | "bad_request"
  | "insecure_base_url"
  | "api_key_required"
  | "base_url_required";

export interface AiTestResult {
  ok: boolean;
  latencyMs: number;
  model: string | null;
  structuredOutput: AiStructuredOutput;
  usage: { inputTokens: number; outputTokens: number } | null;
  error: { code: AiTestErrorCode; message: string } | null;
}

export interface ListAiModelsInput {
  provider: AiProviderId;
  apiKey?: string;
  baseUrl?: string;
}

export interface AiModel {
  id: string;
  label: string;
  contextWindow: number | null;
  recommended: boolean;
}

export interface AiModelList {
  provider: AiProviderId;
  source: "live" | "catalog";
  fetchedAt: string;
  warning: { code: string; message: string } | null;
  models: AiModel[];
}
