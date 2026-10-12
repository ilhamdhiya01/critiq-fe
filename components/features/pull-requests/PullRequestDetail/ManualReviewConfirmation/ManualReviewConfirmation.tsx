import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import Icon from "@/components/ui/icon/Icon";

interface ManualReviewConfirmationProps {
  checked: boolean;
  onToggle: () => void;
}

// Required for Approve under a Require both policy.
const ManualReviewConfirmation = React.memo(
  ({ checked, onToggle }: ManualReviewConfirmationProps) => (
    <div className="flex items-center gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-3.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Manual review confirmation"
        onClick={onToggle}
        className={classNames(
          "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
          checked
            ? "border-success bg-success"
            : "border-border-default bg-raised",
        )}
      >
        {checked && (
          <Icon icon="TbCheck" size={12} className="text-neutral-950" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-text-strong">
          Manual review confirmation
        </span>
        <span className="text-[11.5px] text-text-faint">
          I have manually reviewed the full diff and the flagged issues above.
        </span>
      </div>

      <Badge tone={checked ? "green" : "orange"}>
        {checked ? "DONE" : "REQUIRED"}
      </Badge>
    </div>
  ),
);

ManualReviewConfirmation.displayName = "ManualReviewConfirmation";

export default ManualReviewConfirmation;
