import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StepFooter from "../StepFooter";

const onBack = vi.fn();
const onExit = vi.fn();
const onContinue = vi.fn();

const renderFooter = (
  props: Partial<React.ComponentProps<typeof StepFooter>> = {},
) =>
  render(
    <StepFooter
      canBack
      canContinue
      isLastStep={false}
      isLoading={false}
      onBack={onBack}
      onContinue={onContinue}
      {...props}
    />,
  );

describe("StepFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("goes back and continues", () => {
    renderFooter();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("blocks Continue until the step is valid", () => {
    renderFooter({ canContinue: false });

    const next = screen.getByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("blocks Continue while the step is saving", () => {
    renderFooter({ isLoading: true });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("has no Back on the first step", () => {
    renderFooter({ canBack: false });

    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("finishes setup on the last step", () => {
    renderFooter({ isLastStep: true });

    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Continue" }),
    ).not.toBeInTheDocument();
  });

  it("shows the exit action only with a handler", () => {
    const { rerender } = renderFooter();
    expect(
      screen.queryByRole("button", { name: "Skip setup" }),
    ).not.toBeInTheDocument();

    rerender(
      <StepFooter
        canBack
        canContinue
        isLastStep={false}
        isLoading={false}
        onBack={onBack}
        onContinue={onContinue}
        exitLabel="Cancel"
        onExit={onExit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
