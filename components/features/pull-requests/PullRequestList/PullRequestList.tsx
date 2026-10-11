"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import classNames from "classnames";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import Badge from "@/components/ui/badge";
import Icon from "@/components/ui/icon/Icon";
import DataTable from "@/components/ui/table";
import {
  PR_GATE_STATUS_BADGE_STYLE,
  PR_GATE_STATUS_LABEL,
  PULL_REQUEST_NUMBER_PREFIX,
  PULL_REQUEST_POLICY_LABEL,
  PULL_REQUEST_PROVIDER_ICON,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { usePullRequestList } from "@/lib/hooks/pull-requests/usePullRequestList";
import type {
  PullRequest,
  PullRequestFilter,
} from "@/lib/types/pull-request.types";
import { ROUTES } from "@/routes";

import FilterChip from "../FilterChip";
import PullRequestEmptyState from "./PullRequestEmptyState";
import PullRequestListSkeleton from "./PullRequestListSkeleton";

const columnHelper = createColumnHelper<typeof sortableFeatures, PullRequest>();

const FILTER_OPTIONS: { value: PullRequestFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

const matchesFilter = (pr: PullRequest, filter: PullRequestFilter): boolean => {
  if (filter === "all") return true;
  return pr.state.toLowerCase() === filter;
};

interface PullRequestListProps {
  orgId?: string;
}

const PullRequestList = React.memo(({ orgId }: PullRequestListProps) => {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [activeFilter, setActiveFilter] = useState<PullRequestFilter>("all");
  const { data, isLoading } = usePullRequestList(orgId);

  const pullRequests = useMemo(() => data ?? [], [data]);

  const filteredData = useMemo(
    () => pullRequests.filter((pr) => matchesFilter(pr, activeFilter)),
    [pullRequests, activeFilter],
  );

  const counts = useMemo(
    () => ({
      all: pullRequests.length,
      open: pullRequests.filter((pr) => matchesFilter(pr, "open")).length,
      merged: pullRequests.filter((pr) => matchesFilter(pr, "merged")).length,
      closed: pullRequests.filter((pr) => matchesFilter(pr, "closed")).length,
    }),
    [pullRequests],
  );

  const handleSelectFilter = useCallback(
    (value: PullRequestFilter) => setActiveFilter(value),
    [],
  );
  const handleResetFilter = useCallback(() => setActiveFilter("all"), []);

  const handleDetailPullRequest = useCallback(
    (id: string, repositoryId: string) => {
      router.push(ROUTES.pullRequestDetail(slug, id, repositoryId));
    },
    [router, slug],
  );

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("title", {
          id: "pullRequest",
          header: "Pull request",
          enableSorting: false,
          cell: (info) => {
            const pr = info.row.original;
            return (
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-[12.5px] text-neutral-100">
                    {pr.title}
                  </span>
                  <span
                    className={classNames(
                      "shrink-0 font-mono text-[10.5px]",
                      pr.effectivePolicy === "MANUAL_ONLY"
                        ? "text-text-secondary"
                        : "text-primary-400",
                    )}
                  >
                    {PULL_REQUEST_POLICY_LABEL[pr.effectivePolicy]}
                  </span>
                </div>
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-text-secondary">
                  <Icon
                    icon={PULL_REQUEST_PROVIDER_ICON[pr.provider]}
                    size={11}
                    className="shrink-0"
                  />
                  <span className="font-mono">
                    {PULL_REQUEST_NUMBER_PREFIX[pr.provider]}
                    {pr.externalId}
                  </span>
                  <span>·</span>
                  <span className="truncate font-mono">
                    {pr.repositoryPath}
                  </span>
                  <span>·</span>
                  <span className="truncate font-mono">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </span>
                  <span>·</span>
                  <span className="truncate">{pr.authorUsername ?? "—"}</span>
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("criticalCount", {
          header: "Quality gate",
          enableSorting: false,
          cell: (info) => {
            // New BE rows carry the gate result; older rows fall back to the
            // raw critical count this column used to show.
            const gate = info.row.original.qualityGate;
            if (gate) {
              return (
                <Badge palette={PR_GATE_STATUS_BADGE_STYLE[gate.status]}>
                  {PR_GATE_STATUS_LABEL[gate.status]}
                </Badge>
              );
            }
            const criticalCount = info.getValue();
            return (
              <span className="flex items-center gap-1.5 font-mono text-[12px]">
                {criticalCount > 0 ? (
                  <span className="flex items-center gap-1 font-semibold text-danger">
                    <span>{criticalCount}</span>
                    Critical
                  </span>
                ) : (
                  "-"
                )}
              </span>
            );
          },
        }),
        columnHelper.accessor("state", {
          header: "Status",
          enableSorting: false,
          cell: (info) => {
            const { label, dot, text } =
              PULL_REQUEST_STATUS_MAP[info.getValue()];
            return (
              <span className="flex items-center gap-1.5 font-mono text-[12px]">
                <span className={classNames("h-1.5 w-1.5 rounded-full", dot)} />
                <span className={text}>{label}</span>
              </span>
            );
          },
        }),
        columnHelper.accessor("updatedAt", {
          header: "Updated",
          enableSorting: true,
          meta: { align: "right" },
          cell: (info) => (
            <span className="block text-right font-mono text-[11.5px] text-text-secondary">
              {formatRelativeTime(info.getValue())}
            </span>
          ),
        }),
      ]),
    [],
  );

  const table = useTable({
    features: sortableFeatures,
    columns,
    data: filteredData,
  });

  // if (isError) {
  //   return (
  //     <StateStatus
  //       title="Gagal memuat pull request"
  //       description="Terjadi kesalahan saat mengambil data. Coba muat ulang halaman."
  //     />
  //   );
  // }

  if (isLoading) {
    return <PullRequestListSkeleton />;
  }

  if (pullRequests.length === 0) {
    return <PullRequestEmptyState slug={slug} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {FILTER_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            value={option.value}
            label={option.label}
            count={counts[option.value]}
            isActive={activeFilter === option.value}
            onSelect={handleSelectFilter}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <DataTable
          table={table}
          columnCount={columns.length}
          onRowClick={(pr) => handleDetailPullRequest(pr.id, pr.repositoryId)}
          maxHeight="calc(100vh - 170px)"
          colgroup={
            <colgroup>
              <col className="w-auto" />
              <col className="w-30" />
              <col className="w-30" />
              <col className="w-30" />
            </colgroup>
          }
          emptyMessage={
            <>
              No pull requests match this filter.{" "}
              <button
                type="button"
                onClick={handleResetFilter}
                className="cursor-pointer text-info-light hover:underline"
              >
                Show all
              </button>
            </>
          }
        />
      </div>
    </div>
  );
});

PullRequestList.displayName = "PullRequestList";

export default PullRequestList;
