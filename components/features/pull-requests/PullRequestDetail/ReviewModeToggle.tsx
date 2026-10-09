"use client";

import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import { REVIEW_MODE_COPY } from "@/const/pull-request.constant";
import type { ReviewMode } from "@/lib/types/pull-request.types";

interface ReviewModeToggleProps {
  mode: ReviewMode;
  isAiLocked: boolean;
  targetBranch: string;
  onChange: (mode: ReviewMode) => void;
}

const TAB_BASE =
  "flex items-center gap-1.75 rounded-[5px] px-4 py-1.75 font-mono text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

const ReviewModeToggle = React.memo(
  ({ mode, isAiLocked, targetBranch, onChange }: ReviewModeToggleProps) => {
    const isManual = mode === "manual";

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
            onClick={() => onChange("manual")}
            className={classNames(TAB_BASE, {
              "cursor-default bg-white/10 text-text-bright": isManual,
              "cursor-pointer text-text-secondary hover:text-text-strong":
                !isManual,
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
        <span className="text-[11.5px] text-text-muted">
          {isAiLocked ? REVIEW_MODE_COPY.lockedNote : REVIEW_MODE_COPY.freeNote}
        </span>
      </div>
    );
  },
);

ReviewModeToggle.displayName = "ReviewModeToggle";

export default ReviewModeToggle;
