import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const card = tv({
  base: "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
  variants: {
    selected: {
      true: "border-primary-500 bg-primary-950",
      false:
        "border-border-default bg-raised hover:border-border-default hover:bg-raised-alt",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const dot = tv({
  base: "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border",
  variants: {
    selected: {
      true: "border-primary-500",
      false: "border-border-default",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

interface RadioCardProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect"
> {
  selected: boolean;
  onSelect: () => void;
}

const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(
  ({ selected, onSelect, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={onSelect}
        className={card({ selected, className })}
        {...props}
      >
        <span className={dot({ selected })}>
          {selected && <span className="h-2 w-2 rounded-full bg-primary-500" />}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </button>
    );
  },
);

RadioCard.displayName = "RadioCard";

export default RadioCard;
