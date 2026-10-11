import classNames from "classnames";
import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  // Red value, e.g. critical findings above zero.
  isAlert?: boolean;
}

const StatCard = React.memo(
  ({ label, value, isAlert = false }: StatCardProps) => (
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
    </div>
  ),
);

StatCard.displayName = "StatCard";

export default StatCard;
