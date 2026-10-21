import React from "react";

import Badge from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import { SCAN_STATUS_LABEL } from "@/const/repository.constant";
import {
  scanDisplayStatus,
  type ScanStatusInput,
} from "@/lib/helpers/scan-status.helper";
import type { RepoScanStatus } from "@/lib/types/repository.types";

// Scan status, not a quality gate: "Done" deliberately avoids the green
// PASSED look.
const STATIC_TONE: Record<
  Exclude<RepoScanStatus, "DONE">,
  React.ComponentProps<typeof Badge>["tone"]
> = {
  FAILED: "red",
  RUNNING: "primary",
  QUEUED: "primary",
  SUPERSEDED: "gray",
};

interface ScanStatusBadgeProps {
  scan: ScanStatusInput;
}

// One status for a scan, static and AI combined (see scanDisplayStatus).
// Shared by the repo's scan history and the PR's flagged issues.
const ScanStatusBadge = React.memo(({ scan }: ScanStatusBadgeProps) => {
  const display = scanDisplayStatus(scan);

  switch (display.kind) {
    case "static":
      return (
        <Badge tone={STATIC_TONE[display.status]}>
          {SCAN_STATUS_LABEL[display.status]}
        </Badge>
      );
    case "ai_reviewing":
      return (
        <Badge tone="neutral">
          <Spinner size={10} className="text-text-secondary" />
          AI reviewing
        </Badge>
      );
    case "ai_failed":
      return (
        <Badge
          tone="orange"
          title={
            display.errorCode
              ? `AI review failed: ${display.errorCode}`
              : "AI review failed"
          }
        >
          Done · AI failed
        </Badge>
      );
    case "done":
      return (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone="neutral">Done</Badge>
          {display.isStaticOnly && (
            <span className="font-mono text-[10.5px] text-text-faint">
              static only
            </span>
          )}
        </span>
      );
  }
});

ScanStatusBadge.displayName = "ScanStatusBadge";

export default ScanStatusBadge;
