"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Badge from "@/components/ui/badge";
import Icon from "@/components/ui/icon/Icon";

const ManualReviewConfirmation = React.memo(() => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleToggle = useCallback(
    () => setIsConfirmed((current) => !current),
    [],
  );

  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-3.5">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isConfirmed}
        className={classNames(
          "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
          isConfirmed
            ? "border-success bg-success"
            : "border-border-default bg-raised",
        )}
      >
        {isConfirmed && (
          <Icon icon="TbCheck" size={12} className="text-neutral-950" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-text-strong">
          Manual review confirmation
        </span>
        <span className="text-[11.5px] text-text-faint">
          I have manually reviewed the full diff and the flagged issues below.
        </span>
      </div>

      <Badge tone={isConfirmed ? "green" : "orange"}>
        {isConfirmed ? "DONE" : "REQUIRED"}
      </Badge>
    </div>
  );
});

ManualReviewConfirmation.displayName = "ManualReviewConfirmation";

export default ManualReviewConfirmation;
