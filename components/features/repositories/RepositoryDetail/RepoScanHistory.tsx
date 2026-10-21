"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import EmptyState from "@/components/shared/empty-state";
import ScanStatusBadge from "@/components/shared/scan-status-badge";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Skeleton from "@/components/ui/skeleton";
import DataTable from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import {
  getScanTriggerLabel,
  scanDisplayStatus,
} from "@/lib/helpers/scan-status.helper";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { useRepoScans } from "@/lib/hooks/repositories/useRepoScans";
import type { RepoScan } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

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
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: (info) => <ScanStatusBadge scan={info.row.original} />,
  }),
  columnHelper.accessor("trigger", {
    header: "Trigger",
    enableSorting: false,
    cell: (info) => (
      <span className="text-[12px] text-text-secondary">
        {getScanTriggerLabel(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("criticalCount", {
    header: "Critical",
    enableSorting: false,
    cell: (info) => {
      const count = info.getValue();
      // Static findings only while the AI review runs: the count can grow.
      const isPartial =
        scanDisplayStatus(info.row.original).kind === "ai_reviewing";
      return (
        <span
          className={classNames("font-mono text-[12px]", {
            "text-danger-light": count > 0 && !isPartial,
            "text-text-muted": count === 0 || isPartial,
          })}
        >
          {count} critical {isPartial ? "so far" : "found"}
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
        meta="Push & manual rescans · diff only"
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
            minWidth={720}
          />
        )}
      </SectionCard>
    );
  },
);

RepoScanHistory.displayName = "RepoScanHistory";

export default RepoScanHistory;
