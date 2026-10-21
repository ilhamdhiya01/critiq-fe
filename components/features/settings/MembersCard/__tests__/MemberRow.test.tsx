import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrgMember } from "@/lib/types/member.types";

import MemberRow from "../MemberRow";

const MAYA: OrgMember = {
  userId: "u2",
  name: "Maya Okonkwo",
  email: "maya@acme.dev",
  avatarUrl: null,
  role: "reviewer",
  joinedAt: "2026-02-01T00:00:00Z",
  isYou: false,
};

const onChangeRole = vi.fn();
const onRequestRemove = vi.fn();

const renderRow = (member: OrgMember = MAYA, isAdmin = true) =>
  render(
    <MemberRow
      member={member}
      isAdmin={isAdmin}
      onChangeRole={onChangeRole}
      onRequestRemove={onRequestRemove}
    />,
  );

describe("MemberRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets an Admin change another member's role", () => {
    renderRow();

    fireEvent.click(
      screen.getByRole("button", { name: "Change role for Maya Okonkwo" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /^ADMIN/ }));

    expect(onChangeRole).toHaveBeenCalledWith("u2", "admin");
  });

  it("does nothing when the current role is picked again", () => {
    renderRow();

    fireEvent.click(
      screen.getByRole("button", { name: "Change role for Maya Okonkwo" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /^REVIEWER/ }));

    expect(onChangeRole).not.toHaveBeenCalled();
  });

  it("asks to remove the member through the actions menu", () => {
    renderRow();

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Maya Okonkwo" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Remove from organization" }),
    );

    expect(onRequestRemove).toHaveBeenCalledWith(MAYA);
  });

  it("never lets an Admin change their own role, only leave", () => {
    const me = { ...MAYA, isYou: true, role: "admin" as const };
    renderRow(me);

    expect(
      screen.queryByRole("button", { name: /Change role/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Maya Okonkwo" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Leave organization" }),
    );
    expect(onRequestRemove).toHaveBeenCalledWith(me);
  });

  it("gives non-Admins no role or remove controls", () => {
    renderRow(MAYA, false);

    expect(screen.getByText("REVIEWER")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
