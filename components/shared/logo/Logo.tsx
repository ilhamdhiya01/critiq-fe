import classNames from "classnames";
import React from "react";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  variant?: "standard" | "inverted";
  className?: string;
  /** Tailwind class for the wordmark's size. The sidebar sets a smaller
   *  scale than the auth screens, which use the 17px default. */
  wordmarkClassName?: string;
}

const RING_COLOR = { standard: "#6366F1", inverted: "#A5B4FC" } as const;
const TAIL_COLOR = { standard: "#A5B4FC", inverted: "#6366F1" } as const;

const Logo = React.memo(
  ({
    size = 24,
    withWordmark = false,
    variant = "standard",
    className,
    wordmarkClassName,
  }: LogoProps) => {
    return (
      <div className={classNames("flex items-center gap-2.5", className)}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M17.8 6.2A8 8 0 1 0 17.8 17.8"
            stroke={RING_COLOR[variant]}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M16.6 16.6l4 4"
            stroke={TAIL_COLOR[variant]}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
        {withWordmark && (
          <span
            className={classNames(
              "font-mono font-bold tracking-[.14em] text-neutral-50",
              wordmarkClassName ?? "text-[17px]",
            )}
          >
            CRITIQ
          </span>
        )}
      </div>
    );
  },
);

Logo.displayName = "Logo";

export default Logo;
