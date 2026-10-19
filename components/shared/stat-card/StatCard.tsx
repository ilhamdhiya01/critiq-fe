import classNames from "classnames";
import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  // Red value, e.g. critical findings above zero.
  isAlert?: boolean;
  // Small line under the value (trend, context).
  hint?: React.ReactNode;
}

const StatCard = React.memo(
  ({ label, value, isAlert = false, hint }: StatCardProps) => (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface px-4 py-3.5">
      <span className="text-[11px] tracking-[.07em] text-text-secondary uppercase">
        {label}
      </span>
      <span
        className={classNames("font-mono text-[26px] leading-none font-bold", {
          "text-danger-light": isAlert,
          "text-neutral-100": !isAlert,
        })}
      >
        {value}
      </span>
      {hint && (
        <span className="mt-0.5 text-[11.5px] text-text-muted">{hint}</span>
      )}
    </div>
  ),
);

StatCard.displayName = "StatCard";

export default StatCard;
