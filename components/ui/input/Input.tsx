import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const input = tv({
  base: "rounded-[7px] border bg-raised px-3.5 py-2.5 text-[13px] text-neutral-100 transition-colors outline-none placeholder:text-text-muted focus:border-primary-500",
  variants: {
    fullWidth: {
      true: "w-full",
    },
    hasError: {
      true: "border-danger focus:border-danger",
      false: "border-border-default",
    },
  },
  defaultVariants: {
    fullWidth: true,
    hasError: false,
  },
});

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fullWidth, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={input({ fullWidth, hasError: !!error, className })}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
