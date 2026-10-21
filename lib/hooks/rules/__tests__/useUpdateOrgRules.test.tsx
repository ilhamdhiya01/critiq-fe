import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RULE_TIER_META } from "@/const/rules.constant";
import { toast } from "@/lib/toast";
import type { ApiResponse } from "@/lib/types/api.types";
import type { OrgRules } from "@/lib/types/rules.types";
import { updateRuleTier } from "@/services/rules.service";

import { rulesKeys } from "../queryKeys";
import { useUpdateOrgRules } from "../useUpdateOrgRules";

vi.mock("@/services/rules.service", () => ({
  updateRuleTier: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const rules = (secrets: boolean, crash: boolean) =>
  ({
    data: {
      tiers: [
        { id: "secrets", enabled: secrets },
        { id: "crash", enabled: crash },
      ],
    },
  }) as unknown as ApiResponse<OrgRules>;

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(rulesKeys.org("org_1"), rules(true, true));
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateOrgRules("org_1"), {
    wrapper,
  });
  const cached = () => client.getQueryData(rulesKeys.org("org_1"));
  return { result, cached };
};

describe("useUpdateOrgRules", () => {
  afterEach(() => vi.clearAllMocks());

  it("flips the switch right away and locks only that tier", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(updateRuleTier).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as never,
    );
    const { result, cached } = setup();

    act(() => result.current.updateTier({ tier: "crash", enabled: false }));

    await waitFor(() => expect(cached()).toEqual(rules(true, false)));
    expect(result.current.pendingTier).toBe("crash");
    expect(updateRuleTier).toHaveBeenCalledWith("org_1", {
      tier: "crash",
      enabled: false,
    });

    const confirmed = { ...rules(true, false), message: "saved" };
    await act(async () => resolve(confirmed));

    await waitFor(() => expect(result.current.pendingTier).toBeUndefined());
    expect(cached()).toEqual(confirmed);
    expect(toast.success).toHaveBeenCalledWith(
      `${RULE_TIER_META.crash.title} dinonaktifkan. Scan berikutnya memakai profil baru.`,
    );
  });

  it("rolls back when the PATCH fails", async () => {
    vi.mocked(updateRuleTier).mockRejectedValue(new Error("Server error"));
    const { result, cached } = setup();

    act(() => result.current.updateTier({ tier: "secrets", enabled: false }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Server error"),
    );
    expect(cached()).toEqual(rules(true, true));
  });

  it("uses a generic message for non-Error failures", async () => {
    vi.mocked(updateRuleTier).mockRejectedValue("nope");
    const { result } = setup();

    act(() => result.current.updateTier({ tier: "secrets", enabled: true }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Gagal menyimpan"),
    );
  });
});
