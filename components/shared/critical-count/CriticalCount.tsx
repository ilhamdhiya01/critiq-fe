import classNames from "classnames";
import React from "react";

import Spinner from "@/components/ui/spinner";
import type { PullRequest } from "@/lib/types/pull-request.types";

interface CriticalCountProps {
  latestScan: PullRequest["latestScan"];
  activeScan?: PullRequest["activeScan"];
}

// Critical findings of a PR's latest scan: a spinner while a scan runs and
// "—" when it was never scanned — never a pass/fail verdict.
const CriticalCount = React.memo(
  ({ latestScan, activeScan }: CriticalCountProps) => {
    if (activeScan) {
      return (
        <span aria-label="Scanning" title="Scanning…" className="flex">
          <Spinner size={14} />
        </span>
      );
    }
    if (!latestScan) {
      return <span className="text-text-muted">—</span>;
    }

    const count = latestScan.criticalCount;
    return (
      <span
        className={classNames("font-mono text-[12.5px]", {
          "text-danger-light": count > 0,
          "text-text-muted": count === 0,
        })}
      >
        {count}
      </span>
    );
  },
);

CriticalCount.displayName = "CriticalCount";

export default CriticalCount;
