"use client";

import React, { useMemo } from "react";

import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import { REVIEW_MODE_COPY } from "@/const/pull-request.constant";
import type { ReviewMode } from "@/lib/types/pull-request.types";

interface ReviewModeToggleProps {
  mode: ReviewMode;
  // The mode the branch policy forces, or null when both tabs are open.
  lockedMode: ReviewMode | null;
  targetBranch: string;
  onChange: (mode: ReviewMode) => void;
}

const ReviewModeToggle = React.memo(
  ({ mode, lockedMode, targetBranch, onChange }: ReviewModeToggleProps) => {
    const isManualLocked = lockedMode === "ai";
    const isAiLocked = lockedMode === "manual";

    const options = useMemo<SegmentedOption<ReviewMode>[]>(
      () => [
        {
          value: "manual",
          label: "Manual Review",
          tone: "neutral",
          disabled: isManualLocked,
          title: isManualLocked
            ? REVIEW_MODE_COPY.manualLockedTooltip(targetBranch)
            : undefined,
        },
        {
          value: "ai",
          label: "AI-Assisted Review",
          icon: "TbSparkles",
          tone: "primary",
          disabled: isAiLocked,
          title: isAiLocked
            ? REVIEW_MODE_COPY.lockedTooltip(targetBranch)
            : REVIEW_MODE_COPY.freeTooltip,
        },
      ],
      [isManualLocked, isAiLocked, targetBranch],
    );

    const note = isAiLocked
      ? REVIEW_MODE_COPY.lockedNote
      : isManualLocked
        ? REVIEW_MODE_COPY.manualLockedNote
        : REVIEW_MODE_COPY.freeNote;

    return (
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <SegmentedControl
          options={options}
          value={mode}
          onChange={onChange}
          ariaLabel="Review mode"
        />
        <span className="text-[11.5px] text-text-muted">{note}</span>
      </div>
    );
  },
);

ReviewModeToggle.displayName = "ReviewModeToggle";

export default ReviewModeToggle;
