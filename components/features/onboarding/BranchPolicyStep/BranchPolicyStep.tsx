"use client";

import React, { useCallback } from "react";

import RadioCard from "@/components/ui/radio-card";

import StepCard from "../StepCard";

export type BranchPolicy = "manual" | "ai" | "both";

interface BranchPolicyStepProps {
  branchPolicy: BranchPolicy | null;
  onBranchPolicyChange: (policy: BranchPolicy) => void;
  footer?: React.ReactNode;
}

const POLICIES: {
  value: BranchPolicy;
  label: string;
  description: string;
}[] = [
  {
    value: "manual",
    label: "Manual only",
    description: "AI-Assisted mode is disabled for PRs targeting main.",
  },
  {
    value: "ai",
    label: "Allow AI",
    description: "Reviewer chooses Manual or AI-Assisted per PR — recommended.",
  },
  {
    value: "both",
    label: "Require both",
    description:
      "AI analysis and manual confirmation must both complete before approval.",
  },
];

const BranchPolicyStep = React.memo(
  ({ branchPolicy, onBranchPolicyChange, footer }: BranchPolicyStepProps) => {
    const handleSelect = useCallback(
      (policy: BranchPolicy) => onBranchPolicyChange(policy),
      [onBranchPolicyChange],
    );

    return (
      <StepCard
        title="Default policy for main"
        description="Applied to every selected repo — adjustable later per branch in Repositories."
        footer={footer}
      >
        <div className="flex flex-col gap-2">
          {POLICIES.map((policy) => (
            <RadioCard
              key={policy.value}
              selected={branchPolicy === policy.value}
              onSelect={() => handleSelect(policy.value)}
            >
              <span className="text-[12.5px] font-semibold text-neutral-100">
                {policy.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-text-secondary">
                {policy.description}
              </span>
            </RadioCard>
          ))}
        </div>
      </StepCard>
    );
  },
);

BranchPolicyStep.displayName = "BranchPolicyStep";

export default BranchPolicyStep;
