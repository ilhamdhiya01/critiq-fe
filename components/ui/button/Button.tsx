import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import { IconProps } from "../icon/Icon";

const button = tv({
  base: "inline-flex items-center justify-center gap-2.5 rounded-[7px] text-[13.5px] font-semibold transition-colors",
  variants: {
    variant: {
      primary: "bg-neutral-100 text-neutral-950 hover:bg-white",
      provider:
        "border border-border-default bg-raised text-[#F0F0F0] hover:border-[#3A3A3A] hover:bg-[#1D1D1D]",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "provider";
  icon?: IconProps["icon"] | React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, icon, className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={button({ variant, className })} {...props}>
        {icon}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
