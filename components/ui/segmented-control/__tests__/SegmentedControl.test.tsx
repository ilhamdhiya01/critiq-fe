import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import SegmentedControl, { type SegmentedOption } from "..";

type Mode = "a" | "b" | "c";

const OPTIONS: SegmentedOption<Mode>[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta", disabled: true, title: "Locked" },
  { value: "c", label: "Gamma", tone: "warning" },
];

const renderControl = (value: Mode | null, onChange = vi.fn()) => {
  render(
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      ariaLabel="Mode"
    />,
  );
  return within(screen.getByRole("radiogroup", { name: "Mode" }));
};

describe("SegmentedControl", () => {
  it("marks the selected option as checked", () => {
    const group = renderControl("c");

    expect(group.getByRole("radio", { name: "Gamma" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(group.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(group.getByRole("radio", { name: "Gamma" })).toHaveClass(
      "text-warning-light",
    );
  });

  it("ignores clicks on locked options", () => {
    const onChange = vi.fn();
    const group = renderControl("a", onChange);
    const locked = group.getByRole("radio", { name: "Beta" });

    expect(locked).toHaveAttribute("aria-disabled", "true");
    expect(locked).toHaveAttribute("title", "Locked");
    fireEvent.click(locked);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(group.getByRole("radio", { name: "Gamma" }));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("moves with arrow keys and skips locked options", () => {
    const onChange = vi.fn();
    const group = renderControl("a", onChange);
    const alpha = group.getByRole("radio", { name: "Alpha" });

    expect(alpha).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(alpha, { key: "ArrowRight" });

    expect(onChange).toHaveBeenCalledWith("c");
    expect(group.getByRole("radio", { name: "Gamma" })).toHaveFocus();
  });

  it("selects nothing when value is null", () => {
    const group = renderControl(null);

    expect(
      group
        .getAllByRole("radio")
        .filter((radio) => radio.getAttribute("aria-checked") === "true"),
    ).toHaveLength(0);
    // Tab still lands on the first usable option.
    expect(group.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});
