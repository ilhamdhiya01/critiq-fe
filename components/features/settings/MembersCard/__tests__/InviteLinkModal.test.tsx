import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { InviteResult } from "@/lib/types/member.types";

import InviteLinkModal from "../InviteLinkModal";

const RESULT: InviteResult = {
  invite: {
    id: "inv_1",
    email: "kara@perusahaan.com",
    role: "reviewer",
    invitedBy: { id: "u1", name: "Alex" },
    createdAt: "2026-10-19T03:00:00Z",
    expiresAt: "2026-10-26T03:00:00Z",
    delivery: { status: "pending", error: null },
  },
  inviteUrl: "https://critiq.app/invite/tok_123",
};

describe("InviteLinkModal", () => {
  it("shows the link once, with a copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<InviteLinkModal result={RESULT} onClose={vi.fn()} />);

    expect(screen.getByText("Invitation sent")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Invite link" })).toHaveValue(
      "https://critiq.app/invite/tok_123",
    );
    expect(
      screen.getByText("This link is shown only once."),
    ).toBeInTheDocument();
    expect(screen.getByText(/emailing kara@perusahaan.com/)).toBeVisible();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(writeText).toHaveBeenCalledWith("https://critiq.app/invite/tok_123");
    expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
  });

  it("asks to share the link manually when email isn't configured", () => {
    render(
      <InviteLinkModal
        result={{
          ...RESULT,
          invite: {
            ...RESULT.invite,
            delivery: { status: "not_configured", error: null },
          },
        }}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Email isn't configured, share this link manually."),
    ).toBeInTheDocument();
  });

  it("renders nothing once the result is dropped", () => {
    const { container } = render(
      <InviteLinkModal result={null} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
