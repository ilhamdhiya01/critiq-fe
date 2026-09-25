"use client";

import classNames from "classnames";
import React from "react";
import { tv } from "tailwind-variants";

import Icon from "@/components/ui/icon/Icon";
import type { DiffLine, DiffLineFlag } from "@/lib/types/pull-request.types";

const diffLineRow = tv({
  slots: {
    row: "group grid cursor-pointer grid-cols-[46px_46px_18px_minmax(0,1fr)_26px]",
    lineNumber: "pr-2.5 text-right",
    marker: "text-center",
    code: "wrap-anywhere whitespace-pre-wrap",
    gutter: "flex items-center",
  },
  variants: {
    type: {
      context: {
        row: "text-diff-context-text",
        lineNumber: "text-diff-gutter",
      },
      added: {
        row: "bg-diff-added-bg text-diff-added-text",
        lineNumber: "text-diff-added-gutter",
        marker: "text-success-light",
      },
      removed: {
        row: "bg-diff-removed-bg text-diff-removed-text",
        lineNumber: "text-diff-removed-gutter",
        marker: "text-danger-light",
      },
      hunk: {},
    },
    flag: {
      none: {
        row: "hover:bg-surface-hover",
      },
      critical: {
        row: "border-l-2 border-danger bg-diff-flagged-bg hover:bg-diff-flagged-critical-hover",
      },
      warning: {
        row: "border-l-2 border-warning bg-diff-flagged-bg hover:bg-diff-flagged-warning-hover",
      },
    },
    isActive: {
      true: {
        row: "bg-surface-active",
      },
    },
  },
  defaultVariants: {
    flag: "none",
    isActive: false,
  },
});

const MARKER: Record<DiffLine["type"], string> = {
  context: "",
  added: "+",
  removed: "−",
  hunk: "",
};

interface DiffLineRowProps {
  line: DiffLine;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  flag?: DiffLineFlag;
}

const DiffLineRow = React.memo(
  ({ line, index, isActive, onSelect, flag }: DiffLineRowProps) => {
    if (line.type === "hunk") {
      return (
        <div className="bg-raised px-5 text-text-muted">{line.content}</div>
      );
    }

    const { row, lineNumber, marker, code, gutter } = diffLineRow({
      type: line.type,
      flag: flag?.severity ?? "none",
      isActive,
    });

    return (
      <div className={row()} onClick={() => onSelect(index)}>
        <span className={lineNumber()}>{line.oldLineNumber ?? ""}</span>
        <span className={lineNumber()}>{line.newLineNumber ?? ""}</span>
        <span className={marker()}>{MARKER[line.type]}</span>
        <span className={code()}>{line.content}</span>
        <span className={gutter()}>
          {flag ? (
            <span title={flag.label} className="relative flex size-2">
              <span
                className={classNames(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  {
                    "bg-danger": flag.severity === "critical",
                    "bg-warning": flag.severity === "warning",
                  },
                )}
              />
              <span
                className={classNames(
                  "relative inline-flex size-2 rounded-full",
                  {
                    "bg-danger": flag.severity === "critical",
                    "bg-warning": flag.severity === "warning",
                  },
                )}
              />
            </span>
          ) : (
            <Icon
              icon={isActive ? "TbMessage" : "TbPlus"}
              size={12}
              className={
                isActive
                  ? "text-primary-300"
                  : "text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
              }
            />
          )}
        </span>
      </div>
    );
  },
);

DiffLineRow.displayName = "DiffLineRow";

export default DiffLineRow;
