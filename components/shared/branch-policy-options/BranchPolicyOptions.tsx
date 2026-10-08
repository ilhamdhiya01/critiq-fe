"use client";

import React, { useCallback } from "react";

import RadioCard from "@/components/ui/radio-card";
import { BRANCH_POLICY_OPTIONS } from "@/const/repository.constant";
import type { BranchPolicy } from "@/lib/types/repository.types";

interface BranchPolicyOptionsProps {
  value: BranchPolicy | null;
  onChange: (policy: BranchPolicy) => void;
}

const BranchPolicyOptions = React.memo(
  ({ value, onChange }: BranchPolicyOptionsProps) => {
    const handleSelect = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onChange(e.currentTarget.value as BranchPolicy);
      },
      [onChange],
    );

    return (
      <div className="flex flex-col gap-2">
        {BRANCH_POLICY_OPTIONS.map((policy) => (
          <RadioCard
            key={policy.value}
            value={policy.value}
            selected={value === policy.value}
            onSelect={handleSelect}
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
    );
  },
);

BranchPolicyOptions.displayName = "BranchPolicyOptions";

export default BranchPolicyOptions;
