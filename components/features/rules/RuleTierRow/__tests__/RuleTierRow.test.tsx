import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RuleTier } from "@/lib/types/rules.types";

import RuleTierRow from "../RuleTierRow";

const TIER: RuleTier = {
  id: "secrets",
  enabled: true,
  engine: "static",
  requiresAi: false,
  staticRules: [],
  aiCategories: [],
};

const onToggle = vi.fn();

const renderRow = (
  props: Partial<React.ComponentProps<typeof RuleTierRow>> = {},
) =>
  render(
    <RuleTierRow
      tier={TIER}
      canEdit
      pending={false}
      onToggle={onToggle}
      {...props}
    />,
  );

describe("RuleTierRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("turns an enabled tier off with the tier itself", () => {
    renderRow();

    const toggle = screen.getByRole("switch", { name: "Secrets aktif" });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledWith(TIER, false);
  });

  it("turns a disabled tier on", () => {
    const off = { ...TIER, enabled: false };
    renderRow({ tier: off });

    fireEvent.click(screen.getByRole("switch", { name: "Secrets nonaktif" }));

    expect(onToggle).toHaveBeenCalledWith(off, true);
  });

  it.each([
    ["a non-Admin", { canEdit: false }],
    ["a pending update", { pending: true }],
  ])("is read-only for %s", (_label, props) => {
    renderRow(props);

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
