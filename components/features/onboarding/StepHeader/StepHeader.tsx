import classNames from "classnames";
import React from "react";

import Logo from "@/components/shared/logo";

const STEPS = [
  { step: 1, label: "ORGANIZATION" },
  { step: 2, label: "REPOSITORIES" },
  { step: 3, label: "BRANCH POLICY" },
] as const;

interface StepHeaderProps {
  currentStep: number;
}

const StepHeader = React.memo(({ currentStep }: StepHeaderProps) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <Logo size={26} withWordmark />
      <div className="flex flex-wrap items-center justify-center gap-4">
        {STEPS.map(({ step, label }) => {
          const isActive = step === currentStep;
          const isDone = step < currentStep;
          return (
            <span key={step} className="flex items-center gap-1.5">
              <span
                className={classNames("h-2 w-2 rounded-full", {
                  "bg-success": isDone,
                  "bg-primary-400": isActive,
                  "bg-neutral-700": !isActive && !isDone,
                })}
              />
              <span
                className={classNames(
                  "font-mono text-[10.5px] tracking-[.06em]",
                  {
                    "text-success": isDone,
                    "text-primary-400": isActive,
                    "text-text-muted": !isActive && !isDone,
                  },
                )}
              >
                {step} · {label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
});

StepHeader.displayName = "StepHeader";

export default StepHeader;
