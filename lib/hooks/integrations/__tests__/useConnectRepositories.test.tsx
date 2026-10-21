import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_BRANCH_POLICY } from "@/const/repository.constant";
import type { ConnectRepositoryResult } from "@/lib/types/repository.types";
import { connectRepositories } from "@/services/integrations.service";

import { useConnectRepositories } from "../useConnectRepositories";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/services/integrations.service", () => ({
  connectRepositories: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const INPUT = {
  source: "github" as const,
  projects: [],
  defaultPolicy: DEFAULT_BRANCH_POLICY,
};

const respond = (items: ConnectRepositoryResult["items"]) =>
  vi.mocked(connectRepositories).mockResolvedValue({ data: { items } });

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useConnectRepositories("org_1"), {
    wrapper,
  });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

describe("useConnectRepositories", () => {
  beforeEach(() => vi.mocked(connectRepositories).mockReset());

  it("refreshes memberships once a repo connects (org setup is done)", async () => {
    respond([{ status: "ok" } as ConnectRepositoryResult["items"][number]]);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleConnectRepositories(INPUT));

    expect(invalidatedKeys()).toContainEqual(["memberships"]);
  });

  it("leaves memberships alone when every repo failed", async () => {
    respond([
      {
        status: "failed",
        providerRepoId: 1,
        error: "provider_unreachable",
      },
    ]);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleConnectRepositories(INPUT));

    expect(invalidatedKeys()).not.toContainEqual(["memberships"]);
  });
});
