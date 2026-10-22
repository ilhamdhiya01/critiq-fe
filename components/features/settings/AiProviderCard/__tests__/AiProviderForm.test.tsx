import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type {
  AiModelList,
  AiSettingsAdmin,
  ListAiModelsInput,
} from "@/lib/types/ai-settings.types";
import {
  listAiModels,
  testAiConnection,
  updateAiSettings,
} from "@/services/ai-settings.service";

import AiProviderForm from "../AiProviderForm";

vi.mock("@/services/ai-settings.service", () => ({
  getAiSettings: vi.fn(),
  updateAiSettings: vi.fn(),
  testAiConnection: vi.fn(),
  listAiModels: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const SETTINGS: AiSettingsAdmin = {
  provider: "anthropic",
  model: "claude-sonnet-4",
  baseUrl: null,
  credentials: { anthropic: { hasKey: true, last4: "abcd" } },
  consent: {
    granted: true,
    at: "2026-10-01T03:00:00Z",
    by: { id: "u1", name: "Alex Winter" },
  },
  locale: "id",
  dailyTokenBudget: 100_000,
  providers: [
    {
      id: "anthropic",
      label: "Anthropic",
      available: true,
      defaultModel: "claude-sonnet-4",
    },
    { id: "openai", label: "OpenAI", available: true, defaultModel: "gpt-4o" },
    {
      id: "openai_compatible",
      label: "OpenAI-compatible",
      available: true,
      needsBaseUrl: true,
      keyOptional: true,
    },
    {
      id: "google",
      label: "Google",
      available: true,
      defaultModel: "gemini-3.8-flash",
    },
  ],
  lastTest: null,
};

const MODELS: Record<string, AiModelList["models"]> = {
  anthropic: [
    {
      id: "claude-sonnet-4",
      label: "Claude Sonnet 4",
      contextWindow: 200_000,
      recommended: true,
    },
    {
      id: "claude-haiku",
      label: "claude-haiku",
      contextWindow: null,
      recommended: false,
    },
  ],
  openai: [
    {
      id: "gpt-4o",
      label: "GPT-4o",
      contextWindow: 128_000,
      recommended: true,
    },
  ],
};

const axiosError = (
  status: number,
  message: string,
  errors?: { field: string; message: string }[],
) =>
  new AxiosError(message, "ERR", undefined, undefined, {
    status,
    data: { errors },
  } as AxiosResponse);

const renderForm = (settings: AiSettingsAdmin = SETTINGS) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AiProviderForm orgId="org_1" settings={settings} />
    </QueryClientProvider>,
  );

const modelSelect = () => screen.getByRole("combobox", { name: "Model" });
const saveButton = () => screen.getByRole("button", { name: "Simpan" });

describe("AiProviderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listAiModels).mockImplementation(
      async (_orgId: string, input: ListAiModelsInput) => ({
        data: {
          provider: input.provider,
          source: "live",
          fetchedAt: "2026-10-21T00:00:00Z",
          warning: null,
          models: MODELS[input.provider] ?? [],
        },
      }),
    );
    vi.mocked(updateAiSettings).mockResolvedValue({ data: SETTINGS });
  });

  it("shows the saved provider, key, model and consent with Save disabled", async () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Anthropic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Key tersimpan · …abcd")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hapus key" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(modelSelect()).toHaveValue("claude-sonnet-4"));
    expect(
      screen.getByRole("option", {
        name: "Claude Sonnet 4 (claude-sonnet-4) · Disarankan · 200K ctx",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText(/Diaktifkan oleh Alex Winter/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(listAiModels).toHaveBeenCalledWith("org_1", {
      provider: "anthropic",
      apiKey: undefined,
      baseUrl: undefined,
    });
  });

  it("keeps a provider the BE marks unavailable disabled", () => {
    renderForm({
      ...SETTINGS,
      providers: SETTINGS.providers.map((provider) =>
        provider.id === "google" ? { ...provider, available: false } : provider,
      ),
    });

    const google = screen.getByRole("button", { name: /Google/ });
    expect(google).toBeDisabled();
    expect(google).toHaveAttribute("title", "Segera tersedia");
    expect(within(google).getByText("SEGERA")).toBeInTheDocument();
  });

  it("Google asks for an AIza key, links to AI Studio and has no base URL", () => {
    renderForm();

    const google = screen.getByRole("button", { name: "Google" });
    expect(google).toBeEnabled();
    fireEvent.click(google);

    expect(screen.getByPlaceholderText("AIza…")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Google AI Studio → Get API key" }),
    ).toHaveAttribute("href", "https://aistudio.google.com/apikey");
    expect(screen.queryByText("Base URL")).not.toBeInTheDocument();
  });

  it("switching provider asks for a key before saving, then sends only the changes", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));

    expect(screen.getByRole("button", { name: "OpenAI" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText("Belum ada key untuk provider ini"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hapus key" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(modelSelect()).toHaveValue("gpt-4o"));

    fireEvent.click(saveButton());
    expect(
      await screen.findByText("API key wajib untuk provider ini."),
    ).toBeInTheDocument();
    expect(updateAiSettings).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Tempel API key"), {
      target: { value: "sk-new" },
    });
    expect(
      screen.queryByText("API key wajib untuk provider ini."),
    ).not.toBeInTheDocument();
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", {
        provider: "openai",
        model: "gpt-4o",
        apiKey: "sk-new",
      }),
    );
    expect(
      await screen.findByText("✓ Pengaturan AI tersimpan."),
    ).toBeInTheDocument();
  });

  it("restores the model chosen earlier when switching back to a provider", async () => {
    renderForm();
    await waitFor(() => expect(modelSelect()).toHaveValue("claude-sonnet-4"));

    fireEvent.change(modelSelect(), { target: { value: "claude-haiku" } });
    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));
    await waitFor(() => expect(modelSelect()).toHaveValue("gpt-4o"));
    fireEvent.click(screen.getByRole("button", { name: "Anthropic" }));

    await waitFor(() => expect(modelSelect()).toHaveValue("claude-haiku"));
  });

  it("asks for a secure base URL and a model for an OpenAI-compatible gateway", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "OpenAI-compatible" }));

    const baseUrl = screen.getByPlaceholderText(
      "https://gateway.example.com/v1",
    );
    expect(screen.getByPlaceholderText("Opsional")).toBeInTheDocument();
    expect(
      screen.getByText("Opsional untuk gateway yang tidak memakai key."),
    ).toBeInTheDocument();

    fireEvent.click(saveButton());
    expect(
      await screen.findByText("Base URL wajib untuk OpenAI-compatible."),
    ).toBeInTheDocument();

    fireEvent.change(baseUrl, { target: { value: "http://localhost:8080" } });
    fireEvent.click(saveButton());

    expect(
      await screen.findByText(/Base URL harus https:\/\/ publik/),
    ).toBeInTheDocument();
    expect(screen.getByText("Pilih atau ketik model.")).toBeInTheDocument();
    expect(updateAiSettings).not.toHaveBeenCalled();
  });

  it("lets the admin type a model that is not listed", async () => {
    renderForm();
    await waitFor(() => expect(modelSelect()).toHaveValue("claude-sonnet-4"));

    fireEvent.change(modelSelect(), { target: { value: "__custom__" } });
    fireEvent.change(
      screen.getByPlaceholderText("ID model, mis. gpt-4o-mini"),
      {
        target: { value: "  claude-next  " },
      },
    );
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", {
        model: "claude-next",
      }),
    );
  });

  it("opens the free-text model input for a saved model the provider no longer lists", async () => {
    renderForm({ ...SETTINGS, model: "claude-legacy" });

    expect(
      await screen.findByPlaceholderText("ID model, mis. gpt-4o-mini"),
    ).toHaveValue("claude-legacy");
    expect(modelSelect()).toHaveValue("__custom__");
  });

  it("confirms before revoking consent; Batal keeps it", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("checkbox"));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Cabut izin data")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();

    fireEvent.click(screen.getByRole("checkbox"));
    dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cabut izin" }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.queryByText(/Diaktifkan oleh/)).not.toBeInTheDocument();

    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", {
        consent: false,
      }),
    );
  });

  it("grants consent without a confirmation when it was never given", async () => {
    renderForm({ ...SETTINGS, consent: { granted: false } });

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();

    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", {
        consent: true,
      }),
    );
  });

  it("deletes the stored key after confirmation", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Hapus key" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Hapus API key Anthropic\?/)).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Hapus key" }));

    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", { apiKey: "" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("sends locale and budget changes, and validates the minimum budget", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "5000" },
    });
    fireEvent.click(saveButton());

    expect(
      await screen.findByText("Minimal 10.000 token per hari."),
    ).toBeInTheDocument();
    expect(updateAiSettings).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "50000" },
    });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(updateAiSettings).toHaveBeenCalledWith("org_1", {
        locale: "en",
        dailyTokenBudget: 50_000,
      }),
    );
  });

  it("shows field errors returned by the server", async () => {
    vi.mocked(updateAiSettings).mockRejectedValue(
      axiosError(422, "api_key_required", [
        { field: "apiKey", message: "api_key_required" },
      ]),
    );
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    fireEvent.click(saveButton());

    expect(
      await screen.findByText("API key wajib untuk provider ini."),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(
      screen.queryByText("✓ Pengaturan AI tersimpan."),
    ).not.toBeInTheDocument();
  });

  it("toasts a save error that has no field", async () => {
    vi.mocked(updateAiSettings).mockRejectedValue(
      axiosError(403, "Request failed"),
    );
    renderForm();

    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Request failed"),
    );
  });

  it("tests the connection with the current values and shows the result", async () => {
    vi.mocked(testAiConnection).mockResolvedValue({
      data: {
        ok: true,
        latencyMs: 1234,
        model: "claude-sonnet-4",
        structuredOutput: "native",
        usage: null,
        error: null,
      },
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() =>
      expect(testAiConnection).toHaveBeenCalledWith("org_1", {
        provider: "anthropic",
        model: "claude-sonnet-4",
        baseUrl: undefined,
        apiKey: undefined,
      }),
    );
    expect(
      await screen.findByText(
        /Koneksi berhasil · 1\.234 ms · claude-sonnet-4 · output native/,
      ),
    ).toBeInTheDocument();
  });

  it("shows a reasoning-model warning as info beside a passed test", async () => {
    vi.mocked(testAiConnection).mockResolvedValue({
      data: {
        ok: true,
        latencyMs: 900,
        model: "gemini-3.8-flash",
        structuredOutput: "native",
        usage: null,
        error: null,
        warning: { code: "reasoning_model", message: "Reasoning model" },
      },
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Model ini berpikir dulu sebelum menjawab; pada diff besar bisa kehabisan token.",
    );
    expect(screen.getByText(/Koneksi berhasil/)).toBeInTheDocument();
  });

  it("keeps the reasoning-model info from the saved last test", () => {
    renderForm({
      ...SETTINGS,
      lastTest: {
        at: "2026-10-21T08:37:00Z",
        ok: true,
        latencyMs: 7525,
        structuredOutput: "native",
        model: "gemini-3.8-flash",
        warning: "reasoning_model",
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Model ini berpikir dulu sebelum menjawab; pada diff besar bisa kehabisan token.",
    );
  });

  it("explains when the test limit is reached", async () => {
    vi.mocked(testAiConnection).mockRejectedValue(
      axiosError(429, "rate_limited"),
    );
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Test connection" }));

    expect(
      await screen.findByText(
        "Batas tes tercapai (5× per jam). Coba lagi nanti.",
      ),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("cannot test before a provider is chosen", () => {
    renderForm({
      ...SETTINGS,
      provider: null,
      model: null,
      credentials: {},
    });

    expect(
      screen.getByRole("button", { name: "Test connection" }),
    ).toBeDisabled();
    // No provider → no key or model rows yet.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
