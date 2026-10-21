import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AI_SETTINGS_ERROR_MESSAGE } from "@/const/ai-settings.constant";
import type { AiProviderOption } from "@/lib/types/ai-settings.types";
import { listAiModels } from "@/services/ai-settings.service";

import { useAiModels } from "../useAiModels";

vi.mock("@/services/ai-settings.service", () => ({
  listAiModels: vi.fn(),
}));

const ANTHROPIC: AiProviderOption = {
  id: "anthropic",
  label: "Anthropic",
  available: true,
};

const COMPATIBLE: AiProviderOption = {
  id: "openai_compatible",
  label: "OpenAI-compatible",
  available: true,
  needsBaseUrl: true,
};

const MODELS = { models: [{ id: "claude" }] };

type Params = Parameters<typeof useAiModels>[1];

const setup = (params: Partial<Params>) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useAiModels("org_1", {
        option: undefined,
        apiKey: "",
        baseUrl: "",
        storedBaseUrl: "",
        ...params,
      }),
    { wrapper },
  );
  return { client, result };
};

const httpError = (status: number, errors: object[] = [], message = "boom") =>
  Object.assign(new Error(message), {
    response: { status, data: { errors } },
  });

describe("useAiModels", () => {
  afterEach(() => vi.mocked(listAiModels).mockReset());

  it("does not fetch without an available provider", () => {
    setup({ option: undefined });
    setup({ option: { ...ANTHROPIC, available: false } });

    expect(listAiModels).not.toHaveBeenCalled();
  });

  it("does not fetch a provider that needs a base URL until one is typed", () => {
    setup({ option: COMPATIBLE, baseUrl: "" });

    expect(listAiModels).not.toHaveBeenCalled();
  });

  it("lists the stored models when nothing new was typed", async () => {
    vi.mocked(listAiModels).mockResolvedValue({ data: MODELS } as never);

    const { result } = setup({ option: ANTHROPIC });

    await waitFor(() => expect(result.current.modelList).toEqual(MODELS));
    expect(listAiModels).toHaveBeenCalledWith("org_1", {
      provider: "anthropic",
      apiKey: undefined,
      baseUrl: undefined,
    });
  });

  it("previews with a typed key without putting it in the query cache", async () => {
    vi.mocked(listAiModels).mockResolvedValue({ data: MODELS } as never);

    const { client, result } = setup({
      option: ANTHROPIC,
      apiKey: "sk-secret",
    });

    await waitFor(() => expect(result.current.modelList).toEqual(MODELS));
    expect(listAiModels).toHaveBeenCalledWith(
      "org_1",
      expect.objectContaining({ apiKey: "sk-secret" }),
    );
    const keys = client
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(JSON.stringify(keys)).not.toContain("sk-secret");
  });

  it("sends the base URL only when it differs from the stored one", async () => {
    vi.mocked(listAiModels).mockResolvedValue({ data: MODELS } as never);

    setup({
      option: COMPATIBLE,
      baseUrl: "https://gw.example.com",
      storedBaseUrl: "https://gw.example.com",
    });
    setup({
      option: COMPATIBLE,
      baseUrl: "https://new.example.com",
      storedBaseUrl: "https://gw.example.com",
    });

    await waitFor(() => expect(listAiModels).toHaveBeenCalledTimes(2));
    expect(listAiModels).toHaveBeenCalledWith(
      "org_1",
      expect.objectContaining({ baseUrl: undefined }),
    );
    expect(listAiModels).toHaveBeenCalledWith(
      "org_1",
      expect.objectContaining({ baseUrl: "https://new.example.com" }),
    );
  });

  it("maps field errors and hides the generic message", async () => {
    vi.mocked(listAiModels).mockRejectedValue(
      httpError(422, [{ field: "apiKey", message: "api_key_required" }]),
    );

    const { result } = setup({ option: ANTHROPIC });

    await waitFor(() =>
      expect(result.current.modelsFieldErrors).toEqual({
        apiKey: AI_SETTINGS_ERROR_MESSAGE.api_key_required,
      }),
    );
    expect(result.current.modelsErrorMessage).toBeNull();
  });

  it("surfaces the error message when no field is named", async () => {
    vi.mocked(listAiModels).mockRejectedValue(httpError(502, [], "down"));

    const { result } = setup({ option: ANTHROPIC });

    await waitFor(() => expect(result.current.modelsErrorMessage).toBe("down"));
    expect(result.current.modelsFieldErrors).toEqual({});
  });
});
