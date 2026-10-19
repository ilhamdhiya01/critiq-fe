import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type { Role } from "@/lib/types/auth.types";
import type { MembersData } from "@/lib/types/member.types";
import {
  changeMemberRole,
  getMembers,
  inviteMember,
  removeMember,
  resendInvite,
  revokeInvite,
} from "@/services/members.service";

import MembersCard from "../MembersCard";

let currentRole: Role = "ADMIN";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/hooks/organisation/useOrgBySlug", () => ({
  useOrgBySlug: () => ({ membership: { role: currentRole } }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/members.service", () => ({
  getMembers: vi.fn(),
  inviteMember: vi.fn(),
  resendInvite: vi.fn(),
  revokeInvite: vi.fn(),
  changeMemberRole: vi.fn(),
  removeMember: vi.fn(),
}));

const INVITE = {
  id: "inv_1",
  email: "kara@perusahaan.com",
  role: "viewer" as const,
  invitedBy: { id: "u1", name: "Alex Winter" },
  createdAt: "2026-10-19T03:00:00Z",
  expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  delivery: { status: "sent" as const, error: null },
};

const DATA: MembersData = {
  members: [
    {
      userId: "u1",
      name: "Alex Winter",
      email: "alex@acme.dev",
      avatarUrl: null,
      role: "admin",
      joinedAt: "2026-01-01T00:00:00Z",
      isYou: true,
    },
    {
      userId: "u2",
      name: "Maya Okonkwo",
      email: "maya@acme.dev",
      avatarUrl: null,
      role: "reviewer",
      joinedAt: "2026-02-01T00:00:00Z",
      isYou: false,
    },
  ],
  invites: [INVITE],
};

const LINK = { invite: INVITE, inviteUrl: "https://critiq.app/invite/tok" };

const axiosError = (status: number, code: string) =>
  new AxiosError(code, "ERR", undefined, undefined, {
    status,
    data: { errors: [{ field: "email", message: code }] },
  } as AxiosResponse);

const renderCard = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MembersCard orgId="org_1" />
    </QueryClientProvider>,
  );

const openInvite = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Invite member/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
    target: { value: "kara@perusahaan.com" },
  });
};

describe("MembersCard", { timeout: 15_000 }, () => {
  beforeEach(() => {
    currentRole = "ADMIN";
    vi.clearAllMocks();
    vi.mocked(getMembers).mockResolvedValue({ data: DATA });
  });

  it("gives Admins every control", async () => {
    renderCard();

    expect(await screen.findByText("Members (2)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invite member/ })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Change role for Maya Okonkwo" }),
    ).toBeVisible();
    expect(screen.getByText("kara@perusahaan.com")).toBeVisible();
    expect(screen.getByText(/expires in 3 days/)).toBeVisible();
    expect(
      screen.queryByText(/Only Admins can invite/),
    ).not.toBeInTheDocument();
  });

  it("shows Viewers the list only, with the Admin note", async () => {
    currentRole = "VIEWER";
    vi.mocked(getMembers).mockResolvedValue({
      data: { ...DATA, invites: null },
    });
    renderCard();

    expect(await screen.findByText("Maya Okonkwo")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("kara@perusahaan.com")).not.toBeInTheDocument();
    expect(screen.getByText(/Only Admins can invite/)).toBeVisible();
  });

  it("invites by email and shows the one-time link", async () => {
    vi.mocked(inviteMember).mockResolvedValue({ data: LINK });
    renderCard();
    await openInvite();
    fireEvent.click(screen.getByRole("radio", { name: "VIEWER" }));
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() =>
      expect(inviteMember).toHaveBeenCalledWith("org_1", {
        email: "kara@perusahaan.com",
        role: "viewer",
      }),
    );
    expect(await screen.findByText("Invitation sent")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Invite link" })).toHaveValue(
      "https://critiq.app/invite/tok",
    );
  });

  it.each([
    [409, "already_member", /already a member/],
    [429, "invite_rate_limited", /Too many invitations/],
  ] as const)("explains %s %s", async (status, code, message) => {
    vi.mocked(inviteMember).mockRejectedValue(axiosError(status, code));
    renderCard();
    await openInvite();
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("offers Resend when an invite is already pending", async () => {
    vi.mocked(inviteMember).mockRejectedValue(
      axiosError(409, "invite_pending"),
    );
    vi.mocked(resendInvite).mockResolvedValue({ data: LINK });
    renderCard();
    await openInvite();
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Resend invite" }),
    );
    await waitFor(() =>
      expect(resendInvite).toHaveBeenCalledWith("org_1", "inv_1"),
    );
    expect(await screen.findByText("Invitation sent")).toBeInTheDocument();
  });

  it("changes a role and rolls back on last_admin", async () => {
    vi.mocked(changeMemberRole).mockRejectedValue(
      axiosError(422, "last_admin"),
    );
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Change role for Maya Okonkwo",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /^VIEWER/ }));

    await waitFor(() =>
      expect(changeMemberRole).toHaveBeenCalledWith("org_1", "u2", "viewer"),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "An organization needs at least one Admin.",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Change role for Maya Okonkwo" }),
    ).toHaveTextContent("REVIEWER");
  });

  it("removes a member after confirmation", async () => {
    vi.mocked(removeMember).mockResolvedValue({ data: { userId: "u2" } });
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "More actions for Maya Okonkwo",
      }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Remove from organization" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(removeMember).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(removeMember).toHaveBeenCalledWith("org_1", "u2"),
    );
  });

  it("resends and revokes pending invites", async () => {
    vi.mocked(resendInvite).mockResolvedValue({ data: LINK });
    vi.mocked(revokeInvite).mockResolvedValue({ data: { id: "inv_1" } });
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "Resend" }));
    await waitFor(() =>
      expect(resendInvite).toHaveBeenCalledWith("org_1", "inv_1"),
    );
    expect(await screen.findByText("Invitation sent")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() =>
      expect(revokeInvite).toHaveBeenCalledWith("org_1", "inv_1"),
    );
  });
});
