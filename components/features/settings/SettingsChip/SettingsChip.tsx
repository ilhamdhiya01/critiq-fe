import React from "react";
import { tv } from "tailwind-variants";

const chip = tv({
  base: "inline-flex items-center rounded-full border px-2.25 py-0.5 font-mono text-[10.5px] font-semibold tracking-[.03em] whitespace-nowrap",
  variants: {
    tone: {
      gray: "border-neutral-400/30 bg-neutral-400/8 text-neutral-400",
      green: "border-success/40 bg-success/10 text-success-light",
      orange: "border-warning/40 bg-warning/10 text-warning-light",
      red: "border-danger/40 bg-danger/10 text-danger-light",
    },
  },
  defaultVariants: {
    tone: "gray",
  },
});

interface SettingsChipProps {
  tone?: "gray" | "green" | "orange" | "red";
  children: React.ReactNode;
}

const SettingsChip = React.memo(({ tone, children }: SettingsChipProps) => (
  <span className={chip({ tone })}>{children}</span>
));

SettingsChip.displayName = "SettingsChip";

export default SettingsChip;
