import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

// One look for every banner: a neutral card like the rest of the UI, with
// colour only on the icon and, for warning/danger, a 2px left bar. Body text
// stays neutral so long messages stay readable.
const notice = tv({
  slots: {
    root: "flex",
    icon: "flex-none",
    text: "leading-normal text-text-nav",
  },
  variants: {
    tone: {
      // Information: the brand accent on the icon only.
      note: { icon: "text-primary-300" },
      // Needs action, nothing broken (pending approval, expiring token).
      warning: { icon: "text-warning-light" },
      // Errors and destructive outcomes.
      danger: { icon: "text-danger-light" },
    },
    // banner = standalone rounded box; row = full-width strip inside a card.
    variant: {
      banner: {
        root: "items-start gap-2.5 rounded-lg border border-border-subtle bg-raised px-3.5 py-2.75",
        icon: "mt-px",
        text: "text-xs",
      },
      row: {
        root: "items-center gap-2 border-b border-b-border-row px-5 py-2.5",
        text: "text-[12px]",
      },
    },
  },
  // The left bar goes last: classes are merged, and the variant's `border` /
  // `border-border-subtle` would otherwise override it.
  compoundVariants: [
    { tone: "warning", class: { root: "border-l-2 border-l-warning" } },
    { tone: "danger", class: { root: "border-l-2 border-l-danger" } },
  ],
  defaultVariants: { tone: "warning", variant: "banner" },
});

interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "note" | "warning" | "danger";
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
        role={role ?? (tone === "note" ? "status" : "alert")}
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
