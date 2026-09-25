import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const textarea = tv({
  base: "resize-none rounded-[7px] border bg-raised px-3.5 py-2.5 text-[13px] text-neutral-100 transition-colors outline-none placeholder:text-text-muted focus:border-primary-500",
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, fullWidth, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={textarea({ fullWidth, hasError: !!error, className })}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
