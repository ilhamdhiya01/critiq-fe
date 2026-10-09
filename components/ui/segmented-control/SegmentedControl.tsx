"use client";

import classNames from "classnames";
import React, { forwardRef, useRef } from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

export type SegmentedTone = "neutral" | "primary" | "warning";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  // Tooltip, e.g. what the option means or why it is locked.
  title?: string;
  // Locked options stay focusable (aria-disabled) but can't be picked.
  disabled?: boolean;
  // Colour of the option while it is selected.
  tone?: SegmentedTone;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  // null = nothing selected (e.g. an "apply to all" control).
  value: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

const segmented = tv({
  slots: {
    root: "rounded-[7px] border border-border-default bg-raised",
    item: "flex items-center justify-center rounded-[5px] font-mono font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
  },
  variants: {
    size: {
      sm: { root: "gap-0.5 p-0.5", item: "gap-1.5 px-3 py-1.25 text-[11px]" },
      md: { root: "gap-0.75 p-0.75", item: "gap-1.75 px-4 py-1.75 text-xs" },
    },
    fullWidth: {
      true: { root: "flex w-full", item: "flex-1" },
      false: { root: "inline-flex" },
    },
  },
  defaultVariants: { size: "md", fullWidth: false },
});

const ACTIVE_TONE: Record<SegmentedTone, string> = {
  neutral: "bg-white/10 text-text-bright",
  primary: "bg-primary-500/22 text-primary-200",
  warning: "bg-warning/15 text-warning-light",
};

const ICON_SIZE = { sm: 12, md: 13 } as const;

const SegmentedControlInner = <T extends string>(
  {
    options,
    value,
    onChange,
    ariaLabel,
    size = "md",
    fullWidth = false,
    className,
  }: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) => {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { root, item } = segmented({ size, fullWidth });

  // Roving tabindex: Tab lands on the selected option (or the first usable).
  const selectedIndex = options.findIndex((option) => option.value === value);
  const focusIndex =
    selectedIndex >= 0
      ? selectedIndex
      : Math.max(
          0,
          options.findIndex((option) => !option.disabled),
        );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();

    for (let offset = 1; offset < options.length; offset++) {
      const next = (index + step * offset + options.length) % options.length;
      if (!options[next].disabled) {
        itemRefs.current[next]?.focus();
        onChange(options[next].value);
        return;
      }
    }
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      className={root({ className })}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        const isDisabled = !!option.disabled;

        return (
          <button
            key={option.value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isDisabled || undefined}
            tabIndex={index === focusIndex ? 0 : -1}
            title={option.title}
            onClick={() => {
              if (!isDisabled && !isActive) onChange(option.value);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={item({
              className: classNames({
                "cursor-not-allowed text-neutral-700": isDisabled,
                [`cursor-default ${ACTIVE_TONE[option.tone ?? "neutral"]}`]:
                  !isDisabled && isActive,
                "cursor-pointer text-text-secondary hover:text-text-strong":
                  !isDisabled && !isActive,
              }),
            })}
          >
            {option.icon && <Icon icon={option.icon} size={ICON_SIZE[size]} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

// forwardRef drops generics; the cast keeps `T` inferred from `options`.
const SegmentedControl = forwardRef(SegmentedControlInner) as (<
  T extends string,
>(
  props: SegmentedControlProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement) & { displayName?: string };

SegmentedControl.displayName = "SegmentedControl";

export default SegmentedControl;
