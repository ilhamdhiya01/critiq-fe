import type { SegmentedOption } from "@/components/ui/segmented-control";
import type {
  AiLocale,
  AiProviderId,
  AiSettingsErrorCode,
  AiTestErrorCode,
} from "@/lib/types/ai-settings.types";

// Reviewer/Viewer responses carry no `providers` list, so the read-only view
// needs its own labels.
export const AI_PROVIDER_LABEL: Record<AiProviderId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openai_compatible: "OpenAI-compatible (self-hosted / gateway)",
  google: "Google",
};

export const AI_LOCALE_OPTIONS: SegmentedOption<AiLocale>[] = [
  { value: "id", label: "Indonesia", tone: "primary" },
  { value: "en", label: "English", tone: "primary" },
];

export const AI_LOCALE_READONLY_LABEL: Record<AiLocale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

export const MIN_DAILY_TOKEN_BUDGET = 10_000;

export const AI_MODELS_DEBOUNCE_MS = 500;

export const AI_SETTINGS_ERROR_MESSAGE: Record<AiSettingsErrorCode, string> = {
  api_key_required: "API key wajib untuk provider ini.",
  base_url_required: "Base URL wajib untuk OpenAI-compatible.",
  insecure_base_url:
    "Base URL harus https:// publik — bukan http://, localhost, atau IP privat.",
  provider_unavailable: "Provider ini belum tersedia.",
  budget_min: "Minimal 10.000 token per hari.",
  model_required: "Pilih atau ketik model.",
};

export const AI_TEST_ERROR_MESSAGE: Record<AiTestErrorCode, string> = {
  auth_failed: "Provider menolak API key (401).",
  rate_limited: "Provider membatasi permintaan. Coba lagi sebentar lagi.",
  timeout: "Provider tidak merespons tepat waktu.",
  provider_unreachable: "Provider tidak bisa dihubungi.",
  invalid_response: "Respons provider tidak valid.",
  output_truncated: "Output provider terpotong.",
  bad_request: "Permintaan ditolak provider (400).",
  insecure_base_url: AI_SETTINGS_ERROR_MESSAGE.insecure_base_url,
  api_key_required: AI_SETTINGS_ERROR_MESSAGE.api_key_required,
  base_url_required: AI_SETTINGS_ERROR_MESSAGE.base_url_required,
};

export const AI_MODELS_WARNING_MESSAGE: Record<string, string> = {
  api_key_missing: "Belum ada API key untuk provider ini.",
  auth_failed: "Provider menolak API key (401).",
};

export const AI_TEST_RATE_LIMIT_MESSAGE =
  "Batas tes tercapai (5× per jam). Coba lagi nanti.";
