import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const card = tv({
  base: "w-full rounded-lg border px-4 py-3 text-left transition-colors disabled:pointer-events-none disabled:opacity-50",
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
        {children}
      </button>
    );
  },
);

RadioCard.displayName = "RadioCard";

export default RadioCard;
