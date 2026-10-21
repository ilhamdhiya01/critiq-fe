import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import Switch from "../Switch";

describe("Switch", () => {
  it("asks for the opposite of its current state", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <Switch aria-label="Email alerts" checked={false} onToggle={onToggle} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Email alerts" }));
    expect(onToggle).toHaveBeenLastCalledWith(true);

    rerender(<Switch aria-label="Email alerts" checked onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("switch", { name: "Email alerts" }));
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });

  it("ignores clicks while disabled", () => {
    const onToggle = vi.fn();
    render(
      <Switch
        aria-label="Email alerts"
        checked={false}
        disabled
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Email alerts" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
