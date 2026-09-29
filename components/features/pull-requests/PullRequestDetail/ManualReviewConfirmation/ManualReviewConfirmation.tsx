"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

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
          isConfirmed ? "border-success bg-success" : "border-border-default",
        )}
      >
        {isConfirmed && (
          <Icon icon="TbCheck" size={12} className="text-neutral-950" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-text-strong">
          Konfirmasi review manual
        </span>
        <span className="text-[11.5px] text-text-faint">
          Saya sudah meninjau seluruh diff dan temuan yang ditandai di bawah.
        </span>
      </div>

      <span
        className={classNames(
          "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold",
          isConfirmed
            ? "border-success/40 bg-success/10 text-success"
            : "border-warning/40 bg-warning/10 text-warning-light",
        )}
      >
        {isConfirmed ? "SELESAI" : "WAJIB"}
      </span>
    </div>
  );
});

ManualReviewConfirmation.displayName = "ManualReviewConfirmation";

export default ManualReviewConfirmation;
