"use client";

import classNames from "classnames";
import React from "react";

import { BRANCH_POLICY_OPTIONS } from "@/const/repository.constant";
import type { BranchPolicy } from "@/lib/types/repository.types";

const ACTIVE_CLASS: Record<BranchPolicy, string> = {
  manual_only: "bg-white/10 text-text-bright",
  allow_ai: "bg-primary-500/22 text-primary-200",
  require_both: "bg-warning/15 text-warning-light",
};

interface PolicySegmentedProps {
  // null = nothing selected (e.g. the "Apply to all branches" control).
  value: BranchPolicy | null;
  onChange: (policy: BranchPolicy) => void;
  ariaLabel: string;
}

const PolicySegmented = React.memo(
  ({ value, onChange, ariaLabel }: PolicySegmentedProps) => (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex gap-0.5 rounded-[7px] border border-border-default bg-raised p-0.5"
    >
      {BRANCH_POLICY_OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.description}
            onClick={() => onChange(option.value)}
            className={classNames(
              "cursor-pointer rounded-[5px] px-3 py-1.25 font-mono text-[11px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
              isActive
                ? ACTIVE_CLASS[option.value]
                : "text-text-secondary hover:text-text-strong",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  ),
);

PolicySegmented.displayName = "PolicySegmented";

export default PolicySegmented;
