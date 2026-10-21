import React from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

const emptyState = tv({
  slots: {
    root: "flex flex-col items-center text-center",
    iconBox:
      "flex items-center justify-center border border-border-default bg-raised text-text-secondary",
    title: "font-mono font-semibold text-text-strong",
    description: "leading-relaxed text-text-secondary",
    actions: "flex flex-wrap items-center justify-center gap-2.5",
  },
  variants: {
    size: {
      // A whole page or list is empty: brings its own card.
      page: {
        root: "rounded-lg border border-border-subtle bg-surface px-6 py-24",
        iconBox: "h-11 w-11 rounded-[10px]",
        title: "mt-5 text-[15px]",
        description: "mt-3 max-w-110 text-[13px]",
        actions: "mt-6",
      },
      // Inside an existing card, SectionCard or table.
      card: {
        root: "px-5 py-10",
        iconBox: "h-9 w-9 rounded-lg",
        title: "mt-3.5 text-[13px]",
        description: "mt-1.5 max-w-90 text-[12px]",
        actions: "mt-4",
      },
    },
  },
  defaultVariants: { size: "card" },
});

const ICON_SIZE = { page: 18, card: 16 } as const;

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: keyof typeof ICON_SIZE;
}

// "Nothing here yet" for pages and cards alike. Errors use StateStatus /
// SectionMessage instead.
const EmptyState = React.memo(
  ({ icon, title, description, action, size = "card" }: EmptyStateProps) => {
    const slots = emptyState({ size });

    return (
      <div className={slots.root()}>
        <span className={slots.iconBox()}>
          <Icon icon={icon} size={ICON_SIZE[size]} aria-hidden />
        </span>
        <h2 className={slots.title()}>{title}</h2>
        {description && <p className={slots.description()}>{description}</p>}
        {action && <div className={slots.actions()}>{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export default EmptyState;
