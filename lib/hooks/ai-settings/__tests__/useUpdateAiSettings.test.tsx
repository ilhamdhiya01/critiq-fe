import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AI_SETTINGS_ERROR_MESSAGE } from "@/const/ai-settings.constant";
import { pullRequestKeys } from "@/lib/hooks/pull-requests/queryKeys";
import { toast } from "@/lib/toast";
import { updateAiSettings } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "../queryKeys";
import { useUpdateAiSettings } from "../useUpdateAiSettings";

vi.mock("@/services/ai-settings.service", () => ({
  updateAiSettings: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const INPUT = { model: "gpt-5", apiKey: "sk-secret" };

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateAiSettings("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const httpError = (status: number, errors: object[] = [], message = "boom") =>
  Object.assign(new Error(message), {
    response: { status, data: { errors } },
  });

describe("useUpdateAiSettings", () => {
  afterEach(() => vi.clearAllMocks());

  it("stores the saved settings and refreshes dependent queries", async () => {
    const response = { data: { provider: "openai", model: "gpt-5" } };
    vi.mocked(updateAiSettings).mockResolvedValue(response as never);
    const { client, result, invalidatedKeys } = setup();

    await act(() => result.current.handleUpdateAiSettings(INPUT));

    expect(client.getQueryData(aiSettingsKeys.detail("org_1"))).toEqual(
      response,
    );
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        aiSettingsKeys.models("org_1"),
        pullRequestKeys.orgDetails("org_1"),
        pullRequestKeys.orgSummaries("org_1"),
      ]),
    );
    await waitFor(() =>
      expect(client.getMutationCache().getAll()).toHaveLength(0),
    );
  });

  it("puts field errors on the form instead of a toast", async () => {
    vi.mocked(updateAiSettings).mockRejectedValue(
      httpError(422, [{ field: "dailyTokenBudget", message: "budget_min" }]),
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleUpdateAiSettings(INPUT)).rejects.toThrow(),
    );

    expect(result.current.saveFieldErrors).toEqual({
      dailyTokenBudget: AI_SETTINGS_ERROR_MESSAGE.budget_min,
    });
    expect(toast.error).not.toHaveBeenCalled();

    act(() => result.current.clearSaveFieldErrors());
    expect(result.current.saveFieldErrors).toEqual({});
  });

  it("translates a known error code in the toast", async () => {
    vi.mocked(updateAiSettings).mockRejectedValue(
      httpError(400, [], "provider_unavailable"),
    );
    const { result } = setup();

    await act(() =>
      expect(result.current.handleUpdateAiSettings(INPUT)).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith(
      AI_SETTINGS_ERROR_MESSAGE.provider_unavailable,
    );
  });

  it("falls back to the raw error message", async () => {
    vi.mocked(updateAiSettings).mockRejectedValue(httpError(500, [], "oops"));
    const { result } = setup();

    await act(() =>
      expect(result.current.handleUpdateAiSettings(INPUT)).rejects.toThrow(),
    );

    expect(toast.error).toHaveBeenCalledWith("oops");
  });
});
