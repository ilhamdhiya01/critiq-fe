import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import Icon from "../icon/Icon";

const box = tv({
  base: "flex h-4 w-4 flex-none items-center justify-center rounded-[4px] border transition-colors",
  variants: {
    checked: {
      true: "border-success bg-success",
      false: "border-border-default bg-raised",
    },
  },
  defaultVariants: {
    checked: false,
  },
});

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <span className={box({ checked: !!checked, className })}>
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
