import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { testAiConnection } from "@/services/ai-settings.service";

import { aiSettingsKeys } from "../queryKeys";
import { useTestAiConnection } from "../useTestAiConnection";

vi.mock("@/services/ai-settings.service", () => ({
  testAiConnection: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const INPUT = { provider: "anthropic" as const, apiKey: "sk-secret" };

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTestAiConnection("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { client, result, invalidatedKeys };
};

const httpError = (status: number, message = "boom") =>
  Object.assign(new Error(message), { response: { status, data: {} } });

describe("useTestAiConnection", () => {
  afterEach(() => vi.clearAllMocks());

  it("keeps the result and refreshes the settings", async () => {
    const outcome = { ok: true, latencyMs: 120 };
    vi.mocked(testAiConnection).mockResolvedValue({ data: outcome } as never);
    const { client, result, invalidatedKeys } = setup();

    await act(() => result.current.handleTestAiConnection(INPUT));

    expect(testAiConnection).toHaveBeenCalledWith("org_1", INPUT);
    expect(result.current.testOutcome).toEqual({
      kind: "result",
      result: outcome,
    });
    expect(invalidatedKeys()).toContainEqual(aiSettingsKeys.detail("org_1"));
    // The typed key must not linger in the mutation cache.
    await waitFor(() =>
      expect(client.getMutationCache().getAll()).toHaveLength(0),
    );
  });

  it("reports a rate limit without a toast", async () => {
    vi.mocked(testAiConnection).mockRejectedValue(httpError(429));
    const { result } = setup();

    await act(() => result.current.handleTestAiConnection(INPUT));

    expect(result.current.testOutcome).toEqual({ kind: "rate_limited" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts other failures and clears the previous outcome", async () => {
    vi.mocked(testAiConnection)
      .mockResolvedValueOnce({ data: { ok: true } } as never)
      .mockRejectedValueOnce(httpError(500, "server down"));
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleTestAiConnection(INPUT));
    await act(() => result.current.handleTestAiConnection(INPUT));

    expect(result.current.testOutcome).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("server down");
    expect(invalidatedKeys()).toHaveLength(2);
  });
});
