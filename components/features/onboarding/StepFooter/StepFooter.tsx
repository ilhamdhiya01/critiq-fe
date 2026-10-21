import React from "react";

import Button from "@/components/ui/button";

interface StepFooterProps {
  canBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  isLoading: boolean;
  onBack: () => void;
  // Leave the wizard (e.g. back to another org). Hidden without a handler.
  exitLabel?: string;
  onExit?: () => void;
  onContinue: () => void;
}

const StepFooter = React.memo(
  ({
    canBack,
    canContinue,
    isLastStep,
    isLoading,
    onBack,
    exitLabel = "Skip setup",
    onExit,
    onContinue,
  }: StepFooterProps) => {
    return (
      // Phones stack full-width buttons (column items stretch); from `sm` it is
      // one row with the spacer pushing exit/continue to the right.
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {canBack && (
          <Button
            type="button"
            variant="provider"
            size="md"
            fullWidth={false}
            onClick={onBack}
          >
            Back
          </Button>
        )}
        <div className="hidden sm:block sm:flex-1" />
        {onExit && (
          <Button
            type="button"
            variant="provider"
            size="md"
            fullWidth={false}
            onClick={onExit}
          >
            {exitLabel}
          </Button>
        )}
        <Button
          type="button"
          size="md"
          fullWidth={false}
          className="px-5"
          disabled={!canContinue}
          isLoading={isLoading}
          onClick={onContinue}
        >
          {isLastStep ? "Finish setup" : "Continue"}
        </Button>
      </div>
    );
  },
);

StepFooter.displayName = "StepFooter";

export default StepFooter;
