import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { logout } from "@/services/auth.service";

import { useLogout } from "../useLogout";

vi.mock("@/services/auth.service", () => ({
  logout: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(["user"], { data: { id: "u_1" } });
  client.setQueryData(["members", "org_1"], { data: [] });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLogout(), { wrapper });
  return { client, result };
};

describe("useLogout", () => {
  afterEach(() => vi.clearAllMocks());

  it("drops every cached query once the session ends", async () => {
    vi.mocked(logout).mockResolvedValue({ data: null } as never);
    const { client, result } = setup();

    await act(() => result.current.handleLogout());

    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("keeps the cache and toasts the BE message on failure", async () => {
    vi.mocked(logout).mockRejectedValue(
      Object.assign(new Error("Network Error"), {
        response: { status: 500, data: { message: "Session store down" } },
      }),
    );
    const { client, result } = setup();

    await act(() => expect(result.current.handleLogout()).rejects.toThrow());

    expect(toast.error).toHaveBeenCalledWith("Session store down");
    expect(client.getQueryData(["user"])).toBeDefined();
    expect(result.current.isLoggingOut).toBe(false);
  });
});
