"use client";

import React from "react";

import BranchPolicyOptions from "@/components/shared/branch-policy-options";
import type { BranchPolicy } from "@/lib/types/repository.types";

import StepCard from "../StepCard";

interface BranchPolicyStepProps {
  branchPolicy: BranchPolicy | null;
  onBranchPolicyChange: (policy: BranchPolicy) => void;
  footer?: React.ReactNode;
}

const BranchPolicyStep = React.memo(
  ({ branchPolicy, onBranchPolicyChange, footer }: BranchPolicyStepProps) => {
    return (
      <StepCard
        title="Default policy for main"
        description="Applied to every selected repo — adjustable later per branch in Repositories."
        footer={footer}
      >
        <BranchPolicyOptions
          value={branchPolicy}
          onChange={onBranchPolicyChange}
        />
      </StepCard>
    );
  },
);

BranchPolicyStep.displayName = "BranchPolicyStep";

export default BranchPolicyStep;
