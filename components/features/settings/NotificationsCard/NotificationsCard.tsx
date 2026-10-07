"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const ToggleRow = React.memo(({ label, checked, onToggle }: ToggleRowProps) => (
  <div className="flex items-center justify-between py-2.5">
    <span className="text-[12.5px] text-text-secondary">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={classNames(
        "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
        checked ? "bg-success" : "bg-border-default",
      )}
    >
      <span
        className={classNames(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  </div>
));

ToggleRow.displayName = "ToggleRow";

const NotificationsCard = React.memo(() => {
  const [scanFailed, setScanFailed] = useState(true);
  const [newCritical, setNewCritical] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleToggleScanFailed = useCallback(
    () => setScanFailed((current) => !current),
    [],
  );
  const handleToggleNewCritical = useCallback(
    () => setNewCritical((current) => !current),
    [],
  );
  const handleToggleWeeklyDigest = useCallback(
    () => setWeeklyDigest((current) => !current),
    [],
  );

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-5">
      <span className="mb-2 font-mono text-[13px] font-semibold text-text-strong">
        Notifications
      </span>

      <div className="flex flex-col divide-y divide-border-row">
        <ToggleRow
          label="Quality gate fails on a monitored repo"
          checked={scanFailed}
          onToggle={handleToggleScanFailed}
        />
        <ToggleRow
          label="New critical issue flagged on my PRs"
          checked={newCritical}
          onToggle={handleToggleNewCritical}
        />
        <ToggleRow
          label="Weekly quality digest email"
          checked={weeklyDigest}
          onToggle={handleToggleWeeklyDigest}
        />
      </div>
    </div>
  );
});

NotificationsCard.displayName = "NotificationsCard";

export default NotificationsCard;
