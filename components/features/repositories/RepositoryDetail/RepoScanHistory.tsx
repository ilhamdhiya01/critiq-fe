"use client";

import classNames from "classnames";
import Link from "next/link";
import React from "react";

import { SCAN_STATUS_LABEL } from "@/const/repository.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { useRepoScans } from "@/lib/hooks/repositories/useRepoScans";
import type { RepoScanStatus } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

// Scan status, not a quality gate — "Done" deliberately avoids the green
// PASSED look.
const STATUS_CLASS: Record<RepoScanStatus, string> = {
  DONE: "border-border-default bg-raised text-text-secondary",
  FAILED: "border-danger/40 bg-danger/10 text-danger-light",
  RUNNING: "border-primary-500/40 bg-primary-500/10 text-primary-300",
  QUEUED: "border-primary-500/40 bg-primary-500/10 text-primary-300",
  SUPERSEDED: "border-border-default text-text-muted",
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
      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <h3 className="font-mono text-[13px] font-semibold text-text-strong">
            PR Scan History
          </h3>
          <span className="font-mono text-[10.5px] tracking-[.04em] text-text-muted">
            ONE SCAN PER PR PUSH · DIFF ONLY
          </span>
        </div>

        {isError ? (
          <p className="px-5 py-6 text-[12.5px] text-danger-light">
            Couldn&apos;t load scan history.
          </p>
        ) : isLoading ? (
          <div className="flex flex-col gap-2 px-5 py-4">
            <div className="animate-shimmer h-4 w-full rounded" />
            <div className="animate-shimmer h-4 w-3/4 rounded" />
          </div>
        ) : !scans || scans.length === 0 ? (
          <p className="px-5 py-8 text-center text-[12.5px] text-text-secondary">
            No scans yet.
          </p>
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
                  <span
                    className={classNames(
                      "inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold",
                      STATUS_CLASS[scan.status],
                    )}
                  >
                    {SCAN_STATUS_LABEL[scan.status]}
                  </span>
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
      </section>
    );
  },
);

RepoScanHistory.displayName = "RepoScanHistory";

export default RepoScanHistory;
