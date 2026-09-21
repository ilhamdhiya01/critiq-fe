"use client";

import React, { useCallback } from "react";

import RadioCard from "@/components/ui/radio-card";

import StepCard from "../StepCard";

export type BranchPolicy = "manual_only" | "allow_ai" | "require_both";

interface BranchPolicyStepProps {
  branchPolicy: BranchPolicy | null;
  onBranchPolicyChange: (policy: BranchPolicy) => void;
  footer?: React.ReactNode;
}

const POLICIES: {
  value: BranchPolicy;
  content: React.ReactNode;
}[] = [
  {
    value: "manual_only",
    content: (
      <>
        <span className="text-[12.5px] font-semibold text-neutral-100">
          Manual only
        </span>
        <span className="mt-0.5 block text-[11px] text-text-secondary">
          AI-Assisted mode is disabled for PRs targeting main.
        </span>
      </>
    ),
  },
  {
    value: "allow_ai",
    content: (
      <>
        <span className="text-[12.5px] font-semibold text-neutral-100">
          Allow AI
        </span>
        <span className="mt-0.5 block text-[11px] text-text-secondary">
          Reviewer chooses Manual or AI-Assisted per PR — recommended.
        </span>
      </>
    ),
  },
  {
    value: "require_both",
    content: (
      <>
        <span className="text-[12.5px] font-semibold text-neutral-100">
          Require both
        </span>
        <span className="mt-0.5 block text-[11px] text-text-secondary">
          AI analysis and manual confirmation must both complete before
          approval.
        </span>
      </>
    ),
  },
];

const BranchPolicyStep = React.memo(
  ({ branchPolicy, onBranchPolicyChange, footer }: BranchPolicyStepProps) => {
    const handleSelect = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onBranchPolicyChange(e.currentTarget.value as BranchPolicy);
      },
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
              value={policy.value}
              selected={branchPolicy === policy.value}
              onSelect={handleSelect}
            >
              {policy.content}
            </RadioCard>
          ))}
        </div>
      </StepCard>
    );
  },
);

BranchPolicyStep.displayName = "BranchPolicyStep";

export default BranchPolicyStep;
