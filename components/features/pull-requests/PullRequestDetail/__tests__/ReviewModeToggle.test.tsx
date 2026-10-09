import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import ReviewModeToggle from "../ReviewModeToggle";

describe("ReviewModeToggle", () => {
  it("locks AI-Assisted under a manual-only policy", () => {
    const onChange = vi.fn();
    render(
      <ReviewModeToggle
        mode="manual"
        isAiLocked
        targetBranch="main"
        onChange={onChange}
      />,
    );

    const aiTab = screen.getByRole("button", { name: /AI-Assisted Review/ });
    expect(aiTab).toHaveAttribute("aria-disabled", "true");
    expect(aiTab).toHaveAttribute(
      "title",
      expect.stringContaining("→ main requires manual review"),
    );

    fireEvent.click(aiTab);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "This branch requires manual review — AI-Assisted mode is disabled by branch policy.",
      ),
    ).toBeInTheDocument();
  });

  it("lets the reviewer switch modes when AI is allowed", () => {
    const onChange = vi.fn();
    render(
      <ReviewModeToggle
        mode="ai"
        isAiLocked={false}
        targetBranch="main"
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole("button", { name: /AI-Assisted Review/ }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Manual Review" }));
    expect(onChange).toHaveBeenCalledWith("manual");
    expect(
      screen.getByText(
        "Either way, the final decision is always yours — AI never auto-approves or merges.",
      ),
    ).toBeInTheDocument();
  });
});
