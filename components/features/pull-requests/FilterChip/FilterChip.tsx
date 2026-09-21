"use client";

import React from "react";
import { tv } from "tailwind-variants";

import type { PullRequestFilter } from "@/lib/types/pull-request.types";

const filterChip = tv({
  base: "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11.5px] transition-colors",
  variants: {
    isActive: {
      true: "bg-surface-active text-neutral-100",
      false: "text-text-nav hover:bg-surface-hover hover:text-text-strong",
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

interface FilterChipProps {
  value: PullRequestFilter;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: (value: PullRequestFilter) => void;
}

const FilterChip = React.memo(
  ({ value, label, count, isActive, onSelect }: FilterChipProps) => {
    const handleClick = () => onSelect(value);

    return (
      <button
        type="button"
        onClick={handleClick}
        className={filterChip({ isActive })}
      >
        {label}
        <span className="text-[10.5px] text-text-secondary">{count}</span>
      </button>
    );
  },
);

FilterChip.displayName = "FilterChip";

export default FilterChip;
