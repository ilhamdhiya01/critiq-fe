import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import SegmentedControl, { type SegmentedOption } from "..";

type Range = "7d" | "30d" | "90d";

const OPTIONS: SegmentedOption<Range>[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const renderControl = (
  props: Partial<React.ComponentProps<typeof SegmentedControl<Range>>> = {},
) => {
  const onChange = vi.fn();
  render(
    <SegmentedControl
      options={OPTIONS}
      value="7d"
      onChange={onChange}
      ariaLabel="Range"
      {...props}
    />,
  );
  return {
    onChange,
    group: within(screen.getByRole("radiogroup", { name: "Range" })),
  };
};

describe("SegmentedControl (behaviour)", () => {
  it("does not re-select the option that is already active", () => {
    const { onChange, group } = renderControl();

    fireEvent.click(group.getByRole("radio", { name: "7 days" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wraps around with ArrowLeft and ArrowUp", () => {
    const { onChange, group } = renderControl();

    fireEvent.keyDown(group.getByRole("radio", { name: "7 days" }), {
      key: "ArrowLeft",
    });
    expect(onChange).toHaveBeenLastCalledWith("90d");
    expect(group.getByRole("radio", { name: "90 days" })).toHaveFocus();

    fireEvent.keyDown(group.getByRole("radio", { name: "90 days" }), {
      key: "ArrowUp",
    });
    expect(onChange).toHaveBeenLastCalledWith("30d");
  });

  it("moves forward with ArrowDown and ignores other keys", () => {
    const { onChange, group } = renderControl();
    const first = group.getByRole("radio", { name: "7 days" });

    fireEvent.keyDown(first, { key: "Enter" });
    fireEvent.keyDown(first, { key: "a" });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith("30d");
  });

  it("does nothing on arrows when every other option is locked", () => {
    const { onChange, group } = renderControl({
      options: [
        OPTIONS[0],
        { ...OPTIONS[1], disabled: true },
        { ...OPTIONS[2], disabled: true },
      ],
    });

    fireEvent.keyDown(group.getByRole("radio", { name: "7 days" }), {
      key: "ArrowRight",
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("puts Tab on the first usable option when nothing is selected", () => {
    const { group } = renderControl({
      value: null,
      options: [{ ...OPTIONS[0], disabled: true }, OPTIONS[1], OPTIONS[2]],
    });

    expect(group.getByRole("radio", { name: "7 days" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(group.getByRole("radio", { name: "30 days" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});
