"use client";

import React from "react";
import { tv } from "tailwind-variants";

const filterChip = tv({
  base: "flex cursor-pointer items-center font-mono transition-colors",
  variants: {
    variant: {
      // Pull request list: plain chip, count as a separate faint number.
      subtle: "gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px]",
      // Activity tabs: bordered button reading "All · 13".
      outlined: "rounded-md border px-5 py-2 text-[12px]",
    },
    isActive: { true: "", false: "" },
  },
  compoundVariants: [
    {
      variant: "subtle",
      isActive: true,
      class: "bg-surface-active text-neutral-100",
    },
    {
      variant: "subtle",
      isActive: false,
      class: "text-text-nav hover:bg-surface-hover hover:text-text-strong",
    },
    {
      variant: "outlined",
      isActive: true,
      class: "border-neutral-100 bg-neutral-100 text-neutral-950",
    },
    {
      variant: "outlined",
      isActive: false,
      class:
        "border-border-default text-text-secondary hover:border-neutral-600 hover:text-text-strong",
    },
  ],
  defaultVariants: { variant: "subtle", isActive: false },
});

interface FilterChipProps<T extends string> {
  value: T;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: (value: T) => void;
  variant?: "subtle" | "outlined";
}

const FilterChipInner = <T extends string>({
  value,
  label,
  count,
  isActive,
  onSelect,
  variant = "subtle",
}: FilterChipProps<T>) => (
  <button
    type="button"
    aria-pressed={isActive}
    onClick={() => onSelect(value)}
    className={filterChip({ variant, isActive })}
  >
    {variant === "outlined" ? (
      `${label} · ${count}`
    ) : (
      <>
        {label}
        <span className="text-[10.5px] text-text-secondary">{count}</span>
      </>
    )}
  </button>
);

// React.memo drops generics; the cast keeps `T` inferred from `value`.
const FilterChip = React.memo(FilterChipInner) as typeof FilterChipInner & {
  displayName?: string;
};

FilterChip.displayName = "FilterChip";

export default FilterChip;
