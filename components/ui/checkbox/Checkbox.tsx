import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import Icon from "../icon/Icon";

const box = tv({
  base: "flex h-4 w-4 flex-none items-center justify-center rounded-[4px] border transition-colors",
  variants: {
    variant: {
      success: "",
      primary: "",
    },
    checked: {
      true: "",
      false: "border-border-default bg-raised",
    },
  },
  compoundVariants: [
    { variant: "success", checked: true, class: "border-success bg-success" },
    {
      variant: "primary",
      checked: true,
      class: "border-primary-400 bg-primary-400",
    },
  ],
  defaultVariants: {
    variant: "success",
    checked: false,
  },
});

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  className?: string;
  variant?: "success" | "primary";
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, variant, ...props }, ref) => {
    return (
      <span className={box({ variant, checked: !!checked, className })}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="sr-only"
          {...props}
        />
        {checked && (
          <Icon
            icon="TbCheck"
            size={11}
            className="stroke-[3] text-neutral-950"
          />
        )}
      </span>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
