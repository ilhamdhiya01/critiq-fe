import {
  AI_SETTINGS_ERROR_MESSAGE,
  MIN_DAILY_TOKEN_BUDGET,
} from "@/const/ai-settings.constant";
import type {
  AiFieldErrors,
  AiFormValues,
  AiProviderOption,
  AiSettings,
  AiSettingsAdmin,
  AiSettingsErrorCode,
  AiSettingsField,
  UpdateAiSettingsInput,
} from "@/lib/types/ai-settings.types";
import type { ApiFieldError } from "@/lib/types/api.types";

const AI_SETTINGS_FIELDS: AiSettingsField[] = [
  "provider",
  "model",
  "baseUrl",
  "apiKey",
  "consent",
  "locale",
  "dailyTokenBudget",
];

const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

export const isAdminSettings = (
  settings: AiSettings,
): settings is AiSettingsAdmin => "providers" in settings;

export const formatContextWindow = (tokens: number): string =>
  tokens >= 1_000_000
    ? `${tokens / 1_000_000}M ctx`
    : `${Math.round(tokens / 1000)}K ctx`;

export const isInsecureBaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol !== "https:" || PRIVATE_HOST_PATTERN.test(url.hostname);
  } catch {
    return true;
  }
};

export const getSavedFormValues = (saved: AiSettingsAdmin): AiFormValues => ({
  provider: saved.provider,
  model: saved.model ?? "",
  baseUrl: saved.baseUrl ?? "",
  consent: saved.consent.granted,
  locale: saved.locale,
  dailyTokenBudget: saved.dailyTokenBudget,
});

export const validateAiForm = (
  values: AiFormValues,
  apiKey: string,
  option: AiProviderOption | undefined,
  hasStoredKey: boolean,
): AiFieldErrors => {
  const errors: AiFieldErrors = {};

  if (option?.needsBaseUrl) {
    if (!values.baseUrl) {
      errors.baseUrl = AI_SETTINGS_ERROR_MESSAGE.base_url_required;
    } else if (isInsecureBaseUrl(values.baseUrl)) {
      errors.baseUrl = AI_SETTINGS_ERROR_MESSAGE.insecure_base_url;
    }
  }

  if (option && !option.keyOptional && !hasStoredKey && !apiKey) {
    errors.apiKey = AI_SETTINGS_ERROR_MESSAGE.api_key_required;
  }

  if (values.provider && !values.model) {
    errors.model = AI_SETTINGS_ERROR_MESSAGE.model_required;
  }

  if (
    !Number.isFinite(values.dailyTokenBudget) ||
    values.dailyTokenBudget < MIN_DAILY_TOKEN_BUDGET
  ) {
    errors.dailyTokenBudget = AI_SETTINGS_ERROR_MESSAGE.budget_min;
  }

  return errors;
};

// Only changed fields are sent. The API key is sent only when the admin typed
// one — it is never filled from the stored key (the BE only exposes last4).
export const buildAiSettingsUpdate = (
  saved: AiSettingsAdmin,
  values: AiFormValues,
  apiKey: string,
  option: AiProviderOption | undefined,
): UpdateAiSettingsInput => {
  const update: UpdateAiSettingsInput = {};

  if (values.provider && values.provider !== saved.provider) {
    update.provider = values.provider;
  }
  if (values.model !== (saved.model ?? "")) {
    update.model = values.model;
  }
  if (option?.needsBaseUrl && values.baseUrl !== (saved.baseUrl ?? "")) {
    update.baseUrl = values.baseUrl;
  }
  if (apiKey) {
    update.apiKey = apiKey;
  }
  if (values.consent !== saved.consent.granted) {
    update.consent = values.consent;
  }
  if (values.locale !== saved.locale) {
    update.locale = values.locale;
  }
  if (values.dailyTokenBudget !== saved.dailyTokenBudget) {
    update.dailyTokenBudget = values.dailyTokenBudget;
  }

  return update;
};

export const toFieldErrors = (errors: ApiFieldError[]): AiFieldErrors =>
  errors.reduce<AiFieldErrors>((acc, error) => {
    const field = error.field as AiSettingsField;
    if (!AI_SETTINGS_FIELDS.includes(field)) return acc;
    acc[field] =
      AI_SETTINGS_ERROR_MESSAGE[error.message as AiSettingsErrorCode] ??
      error.message;
    return acc;
  }, {});
