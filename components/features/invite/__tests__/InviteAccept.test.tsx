import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InvitePreview } from "@/lib/types/member.types";
import { getUser, logout } from "@/services/auth.service";
import { acceptInvite, getInvitePreview } from "@/services/members.service";

import InviteAccept from "../InviteAccept";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/members.service", () => ({
  getInvitePreview: vi.fn(),
  acceptInvite: vi.fn(),
}));

vi.mock("@/services/auth.service", () => ({
  getUser: vi.fn(),
  logout: vi.fn(),
}));

const PREVIEW: InvitePreview = {
  organization: { name: "Acme", slug: "acme" },
  invitedBy: { name: "Alex Winter" },
  role: "reviewer",
  email: "ka***@perusahaan.com",
  expiresAt: "2026-10-26T03:00:00Z",
  status: "pending",
};

const axiosError = (status: number, code: string) =>
  new AxiosError(code, "ERR", undefined, undefined, {
    status,
    data: { errors: [{ field: "token", message: code }] },
  } as AxiosResponse);

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <InviteAccept token="tok_1" />
    </QueryClientProvider>,
  );

describe("InviteAccept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.mocked(getInvitePreview).mockResolvedValue({ data: PREVIEW });
    vi.mocked(getUser).mockResolvedValue({
      data: {
        id: "u9",
        email: "alex@acme.dev",
        name: "Alex Winter",
        avatarUrl: null,
      },
    } as never);
    vi.mocked(logout).mockResolvedValue({ data: { loggedOut: true } });
  });

  it("shows which account will accept before the Accept button", async () => {
    renderPage();

    expect(await screen.findByText("Alex Winter")).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent(
      "Signed in as Alex Winter (alex@acme.dev)",
    );
    expect(screen.getByText(/Invited as/)).toHaveTextContent(
      "ka***@perusahaan.com",
    );
    expect(
      screen.getByRole("button", { name: "Accept invitation" }),
    ).toBeEnabled();
  });

  it("Not you? signs out, keeps the invite and offers login here", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Sign in with GitHub/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBe("tok_1");
    expect(replace).not.toHaveBeenCalled();
  });

  it("remembers the invite and offers sign-in when signed out", async () => {
    vi.mocked(getUser).mockRejectedValue(axiosError(401, "unauthorized"));
    renderPage();

    expect(await screen.findByText("Join Acme")).toBeInTheDocument();
    expect(screen.getByText(/Sign in with GitHub/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBe(
        "tok_1",
      ),
    );
  });

  it("accepts, clears the pending invite and opens the org", async () => {
    window.sessionStorage.setItem("critiq.pendingInvite", "tok_1");
    vi.mocked(acceptInvite).mockResolvedValue({
      data: {
        organization: { id: "org_1", name: "Acme", slug: "acme" },
        role: "reviewer",
      },
    });
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/acme"));
    expect(acceptInvite).toHaveBeenCalledWith("tok_1");
    expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBeNull();
  });

  it("explains already_member without redirecting, and keeps the invite", async () => {
    window.sessionStorage.setItem("critiq.pendingInvite", "tok_1");
    vi.mocked(acceptInvite).mockRejectedValue(
      axiosError(409, "already_member"),
    );
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );

    expect(
      await screen.findByText(/still valid for someone else/),
    ).toHaveTextContent("You're already a member of Acme as Alex Winter.");
    expect(replace).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBe("tok_1");
    expect(screen.getByRole("link", { name: "Go to Acme" })).toHaveAttribute(
      "href",
      "/acme",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign out to accept with another account",
      }),
    );
    expect(await screen.findByText(/Sign in with GitHub/)).toBeInTheDocument();
    expect(window.sessionStorage.getItem("critiq.pendingInvite")).toBe("tok_1");
  });

  it("shows the status when accepting returns 410", async () => {
    vi.mocked(acceptInvite).mockRejectedValue(
      axiosError(410, "invite_expired"),
    );
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );
    expect(
      await screen.findByText("This invitation has expired"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).not.toBeInTheDocument();
  });

  it("shows a terminal status without actions", async () => {
    vi.mocked(getInvitePreview).mockResolvedValue({
      data: { ...PREVIEW, status: "revoked" },
    });
    renderPage();

    expect(
      await screen.findByText("This invitation was revoked"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).not.toBeInTheDocument();
  });

  it("explains an unknown link", async () => {
    vi.mocked(getInvitePreview).mockRejectedValue(axiosError(404, "not_found"));
    renderPage();

    expect(
      await screen.findByText("This invitation link isn't valid"),
    ).toBeInTheDocument();
  });
});
