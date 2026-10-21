import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrgInvite } from "@/lib/types/member.types";

import InviteRow from "../InviteRow";

const INVITE: OrgInvite = {
  id: "inv_1",
  email: "kara@perusahaan.com",
  role: "viewer",
  invitedBy: null,
  createdAt: "2026-10-19T03:00:00Z",
  expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
  delivery: { status: "failed", error: "SMTP down" },
};

const onResend = vi.fn();
const onRevoke = vi.fn();

const renderRow = (isResending = false, isRevoking = false) =>
  render(
    <InviteRow
      invite={INVITE}
      isResending={isResending}
      isRevoking={isRevoking}
      onResend={onResend}
      onRevoke={onRevoke}
    />,
  );

describe("InviteRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resends and revokes by invite id", () => {
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    expect(onResend).toHaveBeenCalledWith("inv_1");
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(onRevoke).toHaveBeenCalledWith("inv_1");
  });

  it("still allows resending an expired invite", () => {
    renderRow();

    expect(screen.getByText(/expired/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend" })).toBeEnabled();
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    "locks both actions while one is running (resending=%s, revoking=%s)",
    (isResending, isRevoking) => {
      renderRow(isResending, isRevoking);

      expect(screen.getByRole("button", { name: /Resend/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /Revoke/ })).toBeDisabled();
    },
  );
});
