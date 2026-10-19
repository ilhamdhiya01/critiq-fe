import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUser, logout } from "@/services/auth.service";

import Navbar from "../Navbar";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/auth.service", () => ({
  getUser: vi.fn(),
  logout: vi.fn(),
}));

describe("Navbar sign out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUser).mockResolvedValue({
      data: {
        id: "u1",
        name: "Ilham Dhiya Ulhaq",
        email: "ilham@acme.dev",
        avatarUrl: null,
        provider: "GITHUB",
      },
    } as never);
    vi.mocked(logout).mockResolvedValue({ data: { loggedOut: true } });
  });

  it("calls the logout endpoint, clears the cache and goes to login", async () => {
    const client = new QueryClient();
    const clear = vi.spyOn(client, "clear");
    render(
      <QueryClientProvider client={client}>
        <Navbar title="Dashboard" />
      </QueryClientProvider>,
    );

    await screen.findByText("Ilham Dhiya Ulhaq");
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalled();
  });
});
