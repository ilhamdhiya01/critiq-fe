"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import EmptyState from "@/components/shared/empty-state";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Badge from "@/components/ui/badge";
import Skeleton from "@/components/ui/skeleton";
import DataTable from "@/components/ui/table";
import { SCAN_STATUS_LABEL } from "@/const/repository.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { useRepoScans } from "@/lib/hooks/repositories/useRepoScans";
import type { RepoScan, RepoScanStatus } from "@/lib/types/repository.types";
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

const EMPTY_SCANS: RepoScan[] = [];

const columnHelper = createColumnHelper<typeof sortableFeatures, RepoScan>();

const columns = columnHelper.columns([
  columnHelper.accessor((scan) => scan.finishedAt ?? scan.createdAt, {
    id: "scannedAt",
    header: "Scanned",
    enableSorting: true,
    cell: (info) => (
      <span className="text-[12px] text-text-secondary">
        {formatRelativeTime(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: (info) => (
      <Badge tone={STATUS_TONE[info.getValue()]}>
        {SCAN_STATUS_LABEL[info.getValue()]}
      </Badge>
    ),
  }),
  columnHelper.accessor("criticalCount", {
    header: "Critical",
    enableSorting: false,
    cell: (info) => {
      const count = info.getValue();
      return (
        <span
          className={classNames("font-mono text-[12px]", {
            "text-danger-light": count > 0,
            "text-text-muted": count === 0,
          })}
        >
          {count} critical found
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "pull",
    header: "Pull request",
    cell: (info) => {
      const pull = info.row.original.pull;
      return (
        <span
          title={pull.title}
          className="font-mono text-[11.5px] text-primary-300"
        >
          #{pull.number}
        </span>
      );
    },
  }),
]);

const RepoScanHistory = React.memo(
  ({ orgId, repoId, slug }: RepoScanHistoryProps) => {
    const router = useRouter();
    const {
      data: scans,
      isLoading,
      isError,
      isUnavailable,
    } = useRepoScans(orgId, repoId);

    const table = useTable({
      features: sortableFeatures,
      columns,
      data: useMemo(() => scans ?? EMPTY_SCANS, [scans]),
    });

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
          <EmptyState
            icon="TbHistory"
            title="No scans yet"
            description="A scan runs whenever a pull request on this repository is opened or updated."
          />
        ) : (
          <DataTable
            table={table}
            columnCount={columns.length}
            onRowClick={(scan) =>
              router.push(ROUTES.pullRequestDetail(slug, scan.pull.id, repoId))
            }
            maxHeight="480px"
          />
        )}
      </SectionCard>
    );
  },
);

RepoScanHistory.displayName = "RepoScanHistory";

export default RepoScanHistory;
