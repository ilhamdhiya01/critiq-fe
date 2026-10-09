"use client";

import classNames from "classnames";
import Link from "next/link";
import React from "react";

import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Badge from "@/components/ui/badge";
import Skeleton from "@/components/ui/skeleton";
import { SCAN_STATUS_LABEL } from "@/const/repository.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { useRepoScans } from "@/lib/hooks/repositories/useRepoScans";
import type { RepoScanStatus } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

// Scan status, not a quality gate — "Done" deliberately avoids the green
// PASSED look.
const STATUS_TONE: Record<
  RepoScanStatus,
  React.ComponentProps<typeof Badge>["tone"]
> = {
  DONE: "neutral",
  FAILED: "red",
  RUNNING: "primary",
  QUEUED: "primary",
  SUPERSEDED: "gray",
};

interface RepoScanHistoryProps {
  orgId: string;
  repoId: string;
  slug: string;
}

const RepoScanHistory = React.memo(
  ({ orgId, repoId, slug }: RepoScanHistoryProps) => {
    const {
      data: scans,
      isLoading,
      isError,
      isUnavailable,
    } = useRepoScans(orgId, repoId);

    // Older BE without the endpoint: hide the whole section.
    if (isUnavailable) return null;

    return (
      <SectionCard
        title="PR Scan History"
        meta="One scan per PR push · diff only"
      >
        {isError ? (
          <SectionMessage tone="danger">
            Couldn&apos;t load scan history.
          </SectionMessage>
        ) : isLoading ? (
          <div className="flex flex-col gap-2 px-5 py-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        ) : !scans || scans.length === 0 ? (
          <SectionMessage>No scans yet.</SectionMessage>
        ) : (
          <ol>
            {scans.map((scan) => (
              <li
                key={scan.id}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-3 border-b border-border-row px-5 py-3 last:border-b-0"
              >
                <span className="text-[12px] text-text-secondary">
                  {formatRelativeTime(scan.finishedAt ?? scan.createdAt)}
                </span>
                <span>
                  <Badge tone={STATUS_TONE[scan.status]}>
                    {SCAN_STATUS_LABEL[scan.status]}
                  </Badge>
                </span>
                <span
                  className={classNames("font-mono text-[12px]", {
                    "text-danger-light": scan.criticalCount > 0,
                    "text-text-muted": scan.criticalCount === 0,
                  })}
                >
                  {scan.criticalCount} critical found
                </span>
                <Link
                  href={ROUTES.pullRequestDetail(slug, scan.pull.id, repoId)}
                  title={scan.pull.title}
                  className="font-mono text-[11.5px] text-info-light hover:underline"
                >
                  #{scan.pull.number}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    );
  },
);

RepoScanHistory.displayName = "RepoScanHistory";

export default RepoScanHistory;
