"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";

import ReviewDecisionBadge from "@/components/shared/review-decision-badge";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Avatar from "@/components/ui/avatar";
import Skeleton from "@/components/ui/skeleton";
import DataTable from "@/components/ui/table";
import { formatPullRef } from "@/lib/helpers/dashboard.helper";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { useDashboardRecentReviews } from "@/lib/hooks/dashboard/useDashboardRecentReviews";
import { useRepoProviders } from "@/lib/hooks/repositories/useRepoProviders";
import type { DashboardRecentReview } from "@/lib/types/dashboard.types";
import { ROUTES } from "@/routes";

const LIMIT = 5;
const EMPTY_REVIEWS: DashboardRecentReview[] = [];
const columnHelper = createColumnHelper<
  typeof sortableFeatures,
  DashboardRecentReview
>();

interface RecentActivityProps {
  orgId?: string;
}

const RecentActivity = React.memo(({ orgId }: RecentActivityProps) => {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const providers = useRepoProviders(orgId);
  const {
    data: reviews,
    isLoading,
    isError,
  } = useDashboardRecentReviews(orgId, LIMIT);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("reviewer", {
          header: "Reviewer",
          enableSorting: false,
          cell: (info) => {
            const reviewer = info.getValue();
            return reviewer ? (
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={reviewer.name}
                  src={reviewer.avatarUrl}
                  size="md"
                />
                <span className="truncate text-[12.5px] text-text-strong">
                  {reviewer.name}
                </span>
              </span>
            ) : (
              <span className="text-[12.5px] text-text-muted italic">
                Deleted user
              </span>
            );
          },
        }),
        columnHelper.accessor("decision", {
          header: "Action",
          enableSorting: false,
          cell: (info) => (
            <ReviewDecisionBadge
              decision={info.getValue()}
              className="tracking-[0.03em] uppercase"
            />
          ),
        }),
        columnHelper.accessor("aiAssisted", {
          header: "Mode",
          enableSorting: false,
          cell: (info) =>
            info.getValue() ? (
              <span className="font-mono text-[12px] text-primary-300">
                AI-Assisted
              </span>
            ) : (
              <span className="font-mono text-[12px] text-text-secondary">
                Manual
              </span>
            ),
        }),
        columnHelper.accessor("pull", {
          header: "Pull request",
          enableSorting: false,
          cell: (info) => {
            const pull = info.getValue();
            return (
              <span
                title={pull.title}
                className="block truncate font-mono text-[12px] text-info-light"
              >
                {formatPullRef(
                  providers.get(pull.repoId),
                  pull.number,
                  pull.repoPath,
                )}
              </span>
            );
          },
        }),
        columnHelper.accessor("createdAt", {
          header: "When",
          enableSorting: false,
          cell: (info) => (
            <span className="text-[12px] text-text-muted">
              {formatRelativeTime(info.getValue())}
            </span>
          ),
        }),
      ]),
    [providers],
  );

  const table = useTable({
    features: sortableFeatures,
    columns,
    data: reviews ?? EMPTY_REVIEWS,
  });

  const handleRowClick = useCallback(
    (review: DashboardRecentReview) =>
      router.push(
        ROUTES.pullRequestDetail(slug, review.pull.id, review.pull.repoId),
      ),
    [router, slug],
  );

  return (
    <SectionCard title="Recent Activity">
      {isError ? (
        <SectionMessage tone="danger">
          Couldn&apos;t load recent activity.
        </SectionMessage>
      ) : isLoading ? (
        <div className="flex flex-col gap-2 px-5 py-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      ) : (
        <DataTable
          table={table}
          columnCount={columns.length}
          onRowClick={handleRowClick}
          emptyMessage="No reviews yet"
        />
      )}
    </SectionCard>
  );
});

RecentActivity.displayName = "RecentActivity";

export default RecentActivity;
