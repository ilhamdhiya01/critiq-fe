import classNames from "classnames";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import { languageDotClass } from "@/lib/helpers/repository.helper";

const dot = tv({
  base: "inline-block flex-none rounded-full",
  variants: {
    size: {
      sm: "h-1.5 w-1.5",
      md: "h-2 w-2",
      lg: "h-2.5 w-2.5",
    },
  },
  defaultVariants: { size: "md" },
});

interface LanguageDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  language: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

// Colour dot for a repository language; renders nothing without a language.
const LanguageDot = forwardRef<HTMLSpanElement, LanguageDotProps>(
  ({ language, size, className, ...props }, ref) => {
    if (!language) return null;

    return (
      <span
        ref={ref}
        data-testid="language-dot"
        className={dot({
          size,
          className: classNames(languageDotClass(language), className),
        })}
        {...props}
      />
    );
  },
);

LanguageDot.displayName = "LanguageDot";

export default LanguageDot;
