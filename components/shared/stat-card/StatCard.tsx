import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface StatCardProps {
  label: string;
  value: number | string;
  // Red value, e.g. critical findings above zero.
  isAlert?: boolean;
  // Small line under the value (trend, context).
  hint?: React.ReactNode;
  // Explains the metric; shows an info icon next to the label.
  tooltip?: string;
}

const StatCard = React.memo(
  ({ label, value, isAlert = false, hint, tooltip }: StatCardProps) => (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface px-4 py-3.5">
      <span
        title={tooltip}
        className="flex items-center gap-1 text-[11px] tracking-[.07em] text-text-secondary uppercase"
      >
        {label}
        {tooltip && (
          <>
            <Icon
              icon="TbInfoCircle"
              size={13}
              aria-hidden
              className="text-text-muted"
            />
            <span className="sr-only">{tooltip}</span>
          </>
        )}
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
