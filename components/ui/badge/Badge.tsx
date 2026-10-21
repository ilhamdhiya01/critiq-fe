import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

export interface BadgePalette {
  text: string;
  bg: string;
  border: string;
}

const badge = tv({
  base: "inline-flex items-center gap-1 border font-mono whitespace-nowrap",
  variants: {
    tone: {
      gray: "border-neutral-400/30 bg-neutral-400/8 text-neutral-400",
      neutral: "border-border-default bg-raised text-text-secondary",
      green: "border-success/40 bg-success/10 text-success-light",
      orange: "border-warning/40 bg-warning/10 text-warning-light",
      red: "border-danger/40 bg-danger/10 text-danger-light",
      primary: "border-primary-500/45 bg-primary-500/12 text-primary-300",
      info: "border-info/40 bg-info/12 text-info-light",
      gitlab: "border-vendor-gitlab/50 bg-vendor-gitlab/15 text-vendor-gitlab",
      // Colours come from `palette` (the *_STYLE maps in const/).
      custom: "",
    },
    size: {
      xs: "px-1.5 py-0.5 text-[9.5px]",
      sm: "px-2.25 py-0.5 text-[10.5px]",
      md: "px-2.5 py-1 text-[11px]",
    },
    shape: {
      pill: "rounded-full",
      // Neutral metadata chips (repo path, branch, language).
      tag: "rounded-md",
    },
    weight: {
      normal: "font-normal",
      semibold: "font-semibold",
    },
    // Opt-in: lets the badge shrink to its container and ellipsize long text
    // (repo paths, branch names). Off by default so badges never squash.
    truncate: {
      true: "max-w-full min-w-0 overflow-hidden",
      false: "shrink-0",
    },
  },
  defaultVariants: {
    tone: "gray",
    size: "sm",
    shape: "pill",
    weight: "semibold",
    truncate: false,
  },
});

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Exclude<keyof typeof badge.variants.tone, "custom">;
  palette?: BadgePalette;
  size?: keyof typeof badge.variants.size;
  shape?: keyof typeof badge.variants.shape;
  weight?: keyof typeof badge.variants.weight;
  truncate?: boolean;
}

// Pill/tag label. Use `tone` for the standard colours or `palette` for a
// status map; never both. Pass `truncate` to let long text ellipsize.
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone,
      palette,
      size,
      shape,
      weight,
      truncate = false,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <span
      ref={ref}
      className={badge({
        tone: palette ? "custom" : tone,
        size,
        shape,
        weight,
        truncate,
        className: [
          palette && `${palette.text} ${palette.bg} ${palette.border}`,
          className,
        ]
          .filter(Boolean)
          .join(" "),
      })}
      {...props}
    >
      {/* text-overflow only applies to a block box, not the flex badge. */}
      {truncate ? <span className="truncate">{children}</span> : children}
    </span>
  ),
);

Badge.displayName = "Badge";

export default Badge;
