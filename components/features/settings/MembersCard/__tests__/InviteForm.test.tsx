import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MemberError } from "@/lib/hooks/members/memberError";
import type { OrgInvite } from "@/lib/types/member.types";

import InviteForm from "../InviteForm";

const INVITE: OrgInvite = {
  id: "inv_1",
  email: "kara@perusahaan.com",
  role: "viewer",
  invitedBy: null,
  createdAt: "2026-10-19T03:00:00Z",
  expiresAt: "2026-10-26T03:00:00Z",
  delivery: { status: "sent", error: null },
};

const onInvite = vi.fn();
const onResend = vi.fn();
const onDone = vi.fn();

const renderForm = (error: MemberError | null = null) =>
  render(
    <InviteForm
      invites={[INVITE]}
      onInvite={onInvite}
      onResend={onResend}
      isSubmitting={false}
      error={error}
      onDone={onDone}
    />,
  );

const emailInput = () => screen.getByRole("textbox", { name: "Email" });
const sendButton = () => screen.getByRole("button", { name: "Send invite" });

describe("InviteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submitting an empty or blank email", () => {
    renderForm();

    expect(sendButton()).toBeDisabled();
    fireEvent.change(emailInput(), { target: { value: "   " } });
    expect(sendButton()).toBeDisabled();
    fireEvent.submit(emailInput().closest("form") as HTMLFormElement);
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("sends the trimmed email with the Reviewer role by default, then resets", async () => {
    onInvite.mockResolvedValue({});
    renderForm();

    fireEvent.change(emailInput(), {
      target: { value: "  new@perusahaan.com " },
    });
    fireEvent.click(sendButton());

    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith({
        email: "new@perusahaan.com",
        role: "reviewer",
      }),
    );
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(emailInput()).toHaveValue("");
  });

  it("sends the chosen role", async () => {
    onInvite.mockResolvedValue({});
    renderForm();

    fireEvent.change(emailInput(), { target: { value: "a@b.co" } });
    fireEvent.click(screen.getByRole("radio", { name: "ADMIN" }));
    fireEvent.click(sendButton());

    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith({ email: "a@b.co", role: "admin" }),
    );
  });

  it("keeps the email when the invite fails", async () => {
    onInvite.mockRejectedValue(new Error("already_member"));
    renderForm();

    fireEvent.change(emailInput(), { target: { value: "a@b.co" } });
    fireEvent.click(sendButton());

    await waitFor(() => expect(onInvite).toHaveBeenCalled());
    expect(onDone).not.toHaveBeenCalled();
    expect(emailInput()).toHaveValue("a@b.co");
  });

  it("resends the matching pending invite (case-insensitive)", async () => {
    onResend.mockResolvedValue({});
    renderForm({
      code: "invite_pending",
      message: "An invitation for this email is already pending.",
    });

    fireEvent.change(emailInput(), {
      target: { value: "KARA@perusahaan.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resend invite" }));

    await waitFor(() => expect(onResend).toHaveBeenCalledWith("inv_1"));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("offers no resend for other errors or an unknown email", () => {
    const { rerender } = renderForm({
      code: "already_member",
      message: "This person is already a member of the organization.",
    });
    fireEvent.change(emailInput(), {
      target: { value: "kara@perusahaan.com" },
    });
    expect(
      screen.queryByRole("button", { name: "Resend invite" }),
    ).not.toBeInTheDocument();

    rerender(
      <InviteForm
        invites={[INVITE]}
        onInvite={onInvite}
        onResend={onResend}
        isSubmitting={false}
        error={{ code: "invite_pending", message: "pending" }}
        onDone={onDone}
      />,
    );
    fireEvent.change(emailInput(), { target: { value: "other@b.co" } });
    expect(
      screen.queryByRole("button", { name: "Resend invite" }),
    ).not.toBeInTheDocument();
  });
});
