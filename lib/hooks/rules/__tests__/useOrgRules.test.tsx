import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getOrgRules } from "@/services/rules.service";

import { rulesKeys } from "../queryKeys";
import { useOrgRules } from "../useOrgRules";

vi.mock("@/services/rules.service", () => ({
  getOrgRules: vi.fn(),
}));

const setup = (orgId: string | undefined) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useOrgRules(orgId), { wrapper });
  return { client, result };
};

describe("useOrgRules", () => {
  afterEach(() => vi.mocked(getOrgRules).mockReset());

  it("waits for the org id", () => {
    setup(undefined);

    expect(getOrgRules).not.toHaveBeenCalled();
  });

  it("drops tiers this build no longer knows", async () => {
    vi.mocked(getOrgRules).mockResolvedValue({
      data: {
        profileVersion: 3,
        tiers: [
          { id: "secrets", enabled: true },
          { id: "ci", enabled: true },
          { id: "crash", enabled: false },
        ],
      },
    } as never);

    const { client, result } = setup("org_1");

    await waitFor(() =>
      expect(result.current.data?.tiers.map((tier) => tier.id)).toEqual([
        "secrets",
        "crash",
      ]),
    );
    expect(result.current.data).toMatchObject({ profileVersion: 3 });
    expect(getOrgRules).toHaveBeenCalledWith("org_1");
    // The raw response stays intact in the cache.
    expect(client.getQueryData(rulesKeys.org("org_1"))).toMatchObject({
      data: { tiers: expect.arrayContaining([{ id: "ci", enabled: true }]) },
    });
  });
});
