import { describe, expect, it } from "vitest";

import type {
  AiProviderOption,
  AiSettingsAdmin,
} from "@/lib/types/ai-settings.types";

import {
  buildAiSettingsUpdate,
  formatContextWindow,
  getSavedFormValues,
  isAdminSettings,
  isInsecureBaseUrl,
  toFieldErrors,
  validateAiForm,
} from "../ai-settings.helper";

const COMPATIBLE: AiProviderOption = {
  id: "openai_compatible",
  label: "OpenAI-compatible (self-hosted / gateway)",
  available: true,
  defaultModel: null,
  models: [],
  needsBaseUrl: true,
  keyOptional: true,
};

const ANTHROPIC: AiProviderOption = {
  id: "anthropic",
  label: "Anthropic",
  available: true,
  defaultModel: "claude-sonnet-5",
  models: ["claude-sonnet-5"],
};

const SAVED: AiSettingsAdmin = {
  provider: "openai_compatible",
  model: "gpt-4o-mini",
  baseUrl: "https://ai.sumopod.com/v1",
  credentials: {
    anthropic: { hasKey: false },
    openai: { hasKey: false },
    openai_compatible: {
      hasKey: true,
      last4: "PmrQ",
      baseUrl: "https://ai.sumopod.com/v1",
    },
  },
  consent: {
    granted: true,
    at: "2026-09-30T05:36:04.956Z",
    by: { id: "u1", name: "Ilham" },
  },
  locale: "id",
  dailyTokenBudget: 2_000_000,
  providers: [ANTHROPIC, COMPATIBLE],
  lastTest: null,
};

describe("buildAiSettingsUpdate", () => {
  it("returns an empty update when nothing changed", () => {
    const values = getSavedFormValues(SAVED);
    expect(buildAiSettingsUpdate(SAVED, values, "", COMPATIBLE)).toEqual({});
  });

  it("sends only the changed fields", () => {
    const values = { ...getSavedFormValues(SAVED), locale: "en" as const };
    expect(buildAiSettingsUpdate(SAVED, values, "", COMPATIBLE)).toEqual({
      locale: "en",
    });
  });

  it("never sends apiKey unless one was typed", () => {
    const values = getSavedFormValues(SAVED);
    expect(
      buildAiSettingsUpdate(SAVED, values, "", COMPATIBLE),
    ).not.toHaveProperty("apiKey");
    expect(buildAiSettingsUpdate(SAVED, values, "sk-new", COMPATIBLE)).toEqual({
      apiKey: "sk-new",
    });
  });

  it("sends baseUrl only for providers that need one", () => {
    const values = {
      ...getSavedFormValues(SAVED),
      provider: "anthropic" as const,
      model: "claude-sonnet-5",
      baseUrl: "https://other.example.com/v1",
    };
    expect(buildAiSettingsUpdate(SAVED, values, "", ANTHROPIC)).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-5",
    });
  });

  it("sends consent as a boolean when it changes", () => {
    const values = { ...getSavedFormValues(SAVED), consent: false };
    expect(buildAiSettingsUpdate(SAVED, values, "", COMPATIBLE)).toEqual({
      consent: false,
    });
  });
});

describe("validateAiForm", () => {
  it("requires an https base URL for openai_compatible", () => {
    const values = { ...getSavedFormValues(SAVED), baseUrl: "" };
    expect(validateAiForm(values, "", COMPATIBLE, true).baseUrl).toBe(
      "Base URL wajib untuk OpenAI-compatible.",
    );
    const insecure = { ...values, baseUrl: "http://gateway.local/v1" };
    expect(validateAiForm(insecure, "", COMPATIBLE, true).baseUrl).toMatch(
      /https:\/\//,
    );
  });

  it("requires a key when the provider has none stored and it is not optional", () => {
    const values = {
      ...getSavedFormValues(SAVED),
      provider: "anthropic" as const,
      model: "claude-sonnet-5",
    };
    expect(validateAiForm(values, "", ANTHROPIC, false).apiKey).toBe(
      "API key wajib untuk provider ini.",
    );
    expect(validateAiForm(values, "sk-x", ANTHROPIC, false).apiKey).toBe(
      undefined,
    );
  });

  it("enforces the minimum daily token budget", () => {
    const values = { ...getSavedFormValues(SAVED), dailyTokenBudget: 9_999 };
    expect(validateAiForm(values, "", COMPATIBLE, true).dailyTokenBudget).toBe(
      "Minimal 10.000 token per hari.",
    );
  });
});

describe("isInsecureBaseUrl", () => {
  it.each([
    ["http://example.com/v1", true],
    ["https://localhost:8000/v1", true],
    ["https://127.0.0.1/v1", true],
    ["https://10.0.0.5/v1", true],
    ["https://192.168.1.10/v1", true],
    ["https://172.20.0.1/v1", true],
    ["not a url", true],
    ["https://ai.sumopod.com/v1", false],
    ["https://172.32.0.1/v1", false],
  ])("%s → %s", (url, expected) => {
    expect(isInsecureBaseUrl(url)).toBe(expected);
  });
});

describe("formatContextWindow", () => {
  it("formats millions and thousands", () => {
    expect(formatContextWindow(1_000_000)).toBe("1M ctx");
    expect(formatContextWindow(200_000)).toBe("200K ctx");
  });
});

describe("toFieldErrors", () => {
  it("maps known fields to Indonesian messages and drops unknown fields", () => {
    expect(
      toFieldErrors([
        { field: "baseUrl", message: "insecure_base_url" },
        { field: "unknown", message: "whatever" },
      ]),
    ).toEqual({
      baseUrl:
        "Base URL harus https:// publik — bukan http://, localhost, atau IP privat.",
    });
  });
});

describe("isAdminSettings", () => {
  it("detects the admin response by its provider list", () => {
    expect(isAdminSettings(SAVED)).toBe(true);
    expect(
      isAdminSettings({
        provider: null,
        model: null,
        consent: { granted: false },
        locale: "id",
      }),
    ).toBe(false);
  });
});
