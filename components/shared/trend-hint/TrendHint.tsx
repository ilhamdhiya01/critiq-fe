import classNames from "classnames";
import React from "react";

const TREND_ARROW = { down: "↓", up: "↑", same: "→" } as const;

interface TrendHintProps {
  direction: keyof typeof TREND_ARROW;
  tone: "good" | "bad" | "neutral";
  text: string;
  // Comparison after the change, e.g. "vs last week".
  children?: React.ReactNode;
}

// "↓ 34% vs last week" line used as a StatCard hint.
const TrendHint = React.memo(
  ({ direction, tone, text, children }: TrendHintProps) => (
    <>
      <span
        className={classNames("font-mono font-semibold", {
          "text-success-light": tone === "good",
          "text-danger-light": tone === "bad",
          "text-text-secondary": tone === "neutral",
        })}
      >
        {TREND_ARROW[direction]} {text}
      </span>
      {children && <> {children}</>}
    </>
  ),
);

TrendHint.displayName = "TrendHint";

export default TrendHint;
