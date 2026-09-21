import Link from "next/link";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import Icon, { IconProps } from "../icon/Icon";

const button = tv({
  base: "inline-flex items-center justify-center gap-2.5 rounded-[7px] font-semibold transition-colors",
  variants: {
    variant: {
      primary: "bg-neutral-100 text-neutral-950 hover:bg-white",
      provider:
        "border border-border-default bg-raised text-[#F0F0F0] hover:border-[#3A3A3A] hover:bg-[#1D1D1D]",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-[12.5px]",
      lg: "py-2.75 text-[13.5px]",
    },
    fullWidth: {
      true: "w-full",
    },
    isLoading: {
      true: "pointer-events-none opacity-50",
    },
    disabled: {
      true: "pointer-events-none opacity-50",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "lg",
    fullWidth: true,
  },
});

interface ButtonBaseProps {
  variant?: "primary" | "provider";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: IconProps["icon"] | React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { link?: undefined };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    link: string;
  };

type ButtonProps = {
  isLoading?: boolean;
  disabled?: boolean;
} & (ButtonAsButton | ButtonAsLink);

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant,
      size,
      fullWidth,
      icon,
      className,
      children,
      link,
      isLoading,
      disabled,
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        {isLoading ? (
          <Icon
            icon="TbLoader2"
            className="h-3 w-3 animate-spin stroke-indigo-300 md:h-4 md:w-4"
          />
        ) : (
          icon
        )}
        {children}
      </>
    );

    if (link) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={button({
            variant,
            size,
            fullWidth,
            className,
            isLoading,
            disabled,
          })}
          href={link}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={button({
          variant,
          size,
          fullWidth,
          className,
          isLoading,
          disabled,
        })}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
