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
      <div className="flex items-center gap-3">
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
        <div className="flex-1" />
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
