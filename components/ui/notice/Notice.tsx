import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

const notice = tv({
  slots: {
    root: "flex",
    icon: "flex-none",
    text: "leading-normal",
  },
  variants: {
    tone: {
      warning: {
        root: "border-warning/35 bg-warning/7",
        icon: "text-warning-light",
        text: "text-warning-soft",
      },
      danger: {
        root: "border-danger/35 bg-danger/7",
        icon: "text-danger-light",
        text: "text-danger-light",
      },
      info: {
        root: "border-info/35 bg-info/7",
        icon: "text-info-light",
        text: "text-info-light",
      },
    },
    // banner = standalone rounded box; row = full-width strip inside a card.
    variant: {
      banner: {
        root: "items-start gap-2.5 rounded-lg border px-3.5 py-2.75",
        icon: "mt-px",
        text: "text-xs",
      },
      row: {
        root: "items-center gap-2 border-b border-b-border-row px-5 py-2.5",
        text: "text-[12px]",
      },
    },
  },
  defaultVariants: { tone: "warning", variant: "banner" },
});

interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "warning" | "danger" | "info";
  variant?: "banner" | "row";
  icon?: IconName;
}

// Warnings/errors are announced (role="alert"); pass `role` to override.
const Notice = forwardRef<HTMLDivElement, NoticeProps>(
  (
    {
      tone = "warning",
      variant = "banner",
      icon = "TbAlertTriangle",
      className,
      children,
      role,
      ...props
    },
    ref,
  ) => {
    const slots = notice({ tone, variant });

    return (
      <div
        ref={ref}
        role={role ?? (tone === "info" ? "status" : "alert")}
        className={slots.root({ className })}
        {...props}
      >
        <Icon
          icon={icon}
          size={variant === "row" ? 13 : 14}
          className={slots.icon()}
        />
        <span className={slots.text()}>{children}</span>
      </div>
    );
  },
);

Notice.displayName = "Notice";

export default Notice;
