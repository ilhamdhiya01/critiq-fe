import classNames from "classnames";
import React from "react";

interface SectionCardProps {
  // A string renders as the standard mono title; pass a node for custom
  // headers (e.g. skeletons).
  title?: React.ReactNode;
  count?: number;
  countTone?: "muted" | "danger";
  // Right side of the header. A string gets the standard caption style.
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// Card with an optional bordered header, used by list/table sections.
const SectionCard = React.memo(
  ({
    title,
    count,
    countTone = "muted",
    meta,
    className,
    children,
  }: SectionCardProps) => (
    <section
      className={classNames(
        "overflow-hidden rounded-lg border border-border-subtle bg-surface",
        className,
      )}
    >
      {(title || meta) && (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          {typeof title === "string" ? (
            <h3 className="font-mono text-[13px] font-semibold text-text-strong">
              {title}
              {count !== undefined && (
                <span
                  className={classNames("font-normal", {
                    "text-text-faint": countTone === "muted",
                    "text-danger-light": countTone === "danger",
                  })}
                >
                  {" "}
                  ({count})
                </span>
              )}
            </h3>
          ) : (
            title
          )}
          {typeof meta === "string" ? (
            <span className="font-mono text-[10.5px] tracking-[.04em] text-text-muted uppercase">
              {meta}
            </span>
          ) : (
            meta
          )}
        </div>
      )}
      {children}
    </section>
  ),
);

SectionCard.displayName = "SectionCard";

export default SectionCard;
