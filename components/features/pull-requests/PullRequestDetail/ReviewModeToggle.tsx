"use client";

import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import { REVIEW_MODE_COPY } from "@/const/pull-request.constant";
import type { ReviewMode } from "@/lib/types/pull-request.types";

interface ReviewModeToggleProps {
  mode: ReviewMode;
  // The mode the branch policy forces, or null when both tabs are open.
  lockedMode: ReviewMode | null;
  targetBranch: string;
  onChange: (mode: ReviewMode) => void;
}

const TAB_BASE =
  "flex items-center gap-1.75 rounded-[5px] px-4 py-1.75 font-mono text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

const ReviewModeToggle = React.memo(
  ({ mode, lockedMode, targetBranch, onChange }: ReviewModeToggleProps) => {
    const isManual = mode === "manual";
    const isManualLocked = lockedMode === "ai";
    const isAiLocked = lockedMode === "manual";

    const note = isAiLocked
      ? REVIEW_MODE_COPY.lockedNote
      : isManualLocked
        ? REVIEW_MODE_COPY.manualLockedNote
        : REVIEW_MODE_COPY.freeNote;

    return (
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <div
          role="group"
          aria-label="Review mode"
          className="inline-flex gap-0.75 rounded-[7px] border border-border-default bg-raised p-0.75"
        >
          <button
            type="button"
            aria-pressed={isManual}
            aria-disabled={isManualLocked}
            title={
              isManualLocked
                ? REVIEW_MODE_COPY.manualLockedTooltip(targetBranch)
                : undefined
            }
            onClick={() => {
              if (!isManualLocked) onChange("manual");
            }}
            className={classNames(TAB_BASE, {
              "cursor-not-allowed text-neutral-700": isManualLocked,
              "cursor-default bg-white/10 text-text-bright":
                !isManualLocked && isManual,
              "cursor-pointer text-text-secondary hover:text-text-strong":
                !isManualLocked && !isManual,
            })}
          >
            Manual Review
          </button>
          <button
            type="button"
            aria-pressed={!isManual}
            aria-disabled={isAiLocked}
            title={
              isAiLocked
                ? REVIEW_MODE_COPY.lockedTooltip(targetBranch)
                : REVIEW_MODE_COPY.freeTooltip
            }
            onClick={() => {
              if (!isAiLocked) onChange("ai");
            }}
            className={classNames(TAB_BASE, {
              "cursor-not-allowed text-neutral-700": isAiLocked,
              "cursor-default bg-primary-500/22 text-primary-200":
                !isAiLocked && !isManual,
              "cursor-pointer text-text-secondary hover:text-text-strong":
                !isAiLocked && isManual,
            })}
          >
            <Icon icon="TbSparkles" size={13} />
            AI-Assisted Review
          </button>
        </div>
        <span className="text-[11.5px] text-text-muted">{note}</span>
      </div>
    );
  },
);

ReviewModeToggle.displayName = "ReviewModeToggle";

export default ReviewModeToggle;
