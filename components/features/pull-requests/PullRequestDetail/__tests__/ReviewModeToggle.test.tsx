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
        lockedMode="manual"
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

  it("opens both tabs under a require-both policy", () => {
    const onChange = vi.fn();
    render(
      <ReviewModeToggle
        mode="ai"
        lockedMode={null}
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

  it("locks Manual Review under an AI-Assisted policy", () => {
    const onChange = vi.fn();
    render(
      <ReviewModeToggle
        mode="ai"
        lockedMode="ai"
        targetBranch="dev"
        onChange={onChange}
      />,
    );

    const manualTab = screen.getByRole("button", { name: "Manual Review" });
    expect(manualTab).toHaveAttribute("aria-disabled", "true");
    expect(manualTab).toHaveAttribute(
      "title",
      expect.stringContaining("→ dev uses AI-Assisted review"),
    );
    expect(
      screen.getByRole("button", { name: /AI-Assisted Review/ }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(manualTab);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "This branch uses AI-Assisted review — Manual mode is disabled by branch policy.",
      ),
    ).toBeInTheDocument();
  });
});
