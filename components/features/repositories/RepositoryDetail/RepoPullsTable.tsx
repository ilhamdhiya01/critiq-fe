"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import CriticalCount from "@/components/shared/critical-count";
import EmptyState from "@/components/shared/empty-state";
import ReviewDecisionBadge from "@/components/shared/review-decision-badge";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Avatar from "@/components/ui/avatar";
import Skeleton from "@/components/ui/skeleton";
import DataTable from "@/components/ui/table";
import { EFFECTIVE_POLICY_LABEL } from "@/const/repository.constant";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { useRepoPulls } from "@/lib/hooks/repositories/useRepoPulls";
import type { PullRequest } from "@/lib/types/pull-request.types";
import { ROUTES } from "@/routes";

interface RepoPullsTableProps {
  orgId: string;
  repoId: string;
  slug: string;
}

const EMPTY_PULLS: PullRequest[] = [];

const columnHelper = createColumnHelper<typeof sortableFeatures, PullRequest>();

const RepoPullsTable = React.memo(
  ({ orgId, repoId, slug }: RepoPullsTableProps) => {
    const router = useRouter();
    const { data: pulls, isLoading, isError } = useRepoPulls(orgId, repoId);

    const columns = useMemo(
      () =>
        columnHelper.columns([
          columnHelper.accessor("title", {
            header: "Title",
            enableSorting: false,
            cell: (info) => {
              const review = info.row.original.latestReview;
              return (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-[12.5px] text-text-strong">
                    {info.getValue()}
                  </span>
                  {review && (
                    <ReviewDecisionBadge
                      decision={review.decision}
                      outdated={review.outdated}
                    />
                  )}
                </span>
              );
            },
          }),
          columnHelper.display({
            id: "author",
            header: "Author",
            cell: (info) => {
              const pull = info.row.original;
              return pull.authorUsername ? (
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={pull.authorUsername} />
                  <span className="truncate text-[12px] text-text-secondary">
                    {pull.authorUsername}
                  </span>
                </span>
              ) : (
                <span className="text-text-muted">—</span>
              );
            },
          }),
          columnHelper.accessor("criticalCount", {
            header: "Critical",
            enableSorting: true,
            cell: (info) => (
              <CriticalCount
                latestScan={info.row.original.latestScan}
                activeScan={info.row.original.activeScan}
              />
            ),
          }),
          columnHelper.accessor("effectivePolicy", {
            header: "Review policy",
            enableSorting: false,
            cell: (info) => (
              <span className="font-mono text-[11.5px] text-text-secondary">
                {EFFECTIVE_POLICY_LABEL[info.getValue()]}
              </span>
            ),
          }),
        ]),
      [],
    );

    const table = useTable({
      features: sortableFeatures,
      columns,
      data: pulls ?? EMPTY_PULLS,
    });

    return (
      <SectionCard title="Pull Requests" count={pulls?.length}>
        {isError ? (
          <SectionMessage tone="danger">
            Couldn&apos;t load pull requests.
          </SectionMessage>
        ) : isLoading ? (
          <div className="flex flex-col gap-2 px-5 py-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        ) : !pulls || pulls.length === 0 ? (
          <EmptyState
            icon="TbGitPullRequest"
            title="No pull requests yet"
            description="Pull requests on this repository show up here automatically."
          />
        ) : (
          <DataTable
            table={table}
            columnCount={columns.length}
            onRowClick={(pull) =>
              router.push(ROUTES.pullRequestDetail(slug, pull.id, repoId))
            }
            maxHeight="480px"
            colgroup={
              <colgroup>
                <col className="w-auto" />
                <col className="w-56" />
                <col className="w-28" />
                <col className="w-36" />
              </colgroup>
            }
          />
        )}
      </SectionCard>
    );
  },
);

RepoPullsTable.displayName = "RepoPullsTable";

export default RepoPullsTable;
