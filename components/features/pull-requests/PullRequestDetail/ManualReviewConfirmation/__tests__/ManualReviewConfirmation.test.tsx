import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import ManualReviewConfirmation from "../ManualReviewConfirmation";

const checkbox = () =>
  screen.getByRole("checkbox", { name: "Manual review confirmation" });

describe("ManualReviewConfirmation", () => {
  it("reflects the confirmation and toggles it on click", () => {
    const onToggle = vi.fn();
    render(<ManualReviewConfirmation checked={false} onToggle={onToggle} />);

    expect(checkbox()).toHaveAttribute("aria-checked", "false");
    fireEvent.click(checkbox());

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("cannot be unchecked once recorded with my approval", () => {
    const onToggle = vi.fn();
    render(<ManualReviewConfirmation checked isLocked onToggle={onToggle} />);

    fireEvent.click(checkbox());

    expect(onToggle).not.toHaveBeenCalled();
    expect(checkbox()).toHaveAttribute("aria-checked", "true");
    expect(checkbox()).toHaveAttribute("aria-disabled", "true");
  });
});
