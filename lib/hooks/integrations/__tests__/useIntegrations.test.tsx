import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Integration } from "@/lib/types/integration.types";
import { getIntegrations } from "@/services/integrations.service";

import { useIntegrations } from "../useIntegrations";

vi.mock("@/services/integrations.service", () => ({
  getIntegrations: vi.fn(),
}));

const integration = (source: "GITHUB" | "GITLAB", state: string) =>
  ({ source, state }) as unknown as Integration;

const setup = (orgId?: string) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useIntegrations(orgId), { wrapper });
  return { result };
};

describe("useIntegrations", () => {
  afterEach(() => vi.mocked(getIntegrations).mockReset());

  it("waits for the org id", () => {
    setup(undefined);

    expect(getIntegrations).not.toHaveBeenCalled();
  });

  it("splits the list by source and upper-cases the BE's states", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [
        integration("GITLAB", "token_expired"),
        integration("GITHUB", "pending_approval"),
      ],
    });

    const { result } = setup("org_1");

    await waitFor(() =>
      expect(result.current.data).toEqual({
        github: integration("GITHUB", "PENDING_APPROVAL"),
        gitlab: integration("GITLAB", "TOKEN_EXPIRED"),
      }),
    );
    expect(getIntegrations).toHaveBeenCalledWith("org_1");
  });

  it("returns null for a provider that is not connected", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [integration("GITHUB", "ACTIVE")],
    });

    const { result } = setup("org_1");

    await waitFor(() =>
      expect(result.current.data).toEqual({
        github: integration("GITHUB", "ACTIVE"),
        gitlab: null,
      }),
    );
  });

  it("treats a missing list as nothing connected", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({ data: null } as never);

    const { result } = setup("org_1");

    await waitFor(() =>
      expect(result.current.data).toEqual({ github: null, gitlab: null }),
    );
  });
});
