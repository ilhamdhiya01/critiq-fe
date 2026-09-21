import React from "react";

import Button from "@/components/ui/button";

interface StepFooterProps {
  canBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  isLoading: boolean;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

const StepFooter = React.memo(
  ({
    canBack,
    canContinue,
    isLastStep,
    isLoading,
    onBack,
    onSkip,
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
        <Button
          type="button"
          variant="provider"
          size="md"
          fullWidth={false}
          onClick={onSkip}
        >
          Skip setup
        </Button>
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
