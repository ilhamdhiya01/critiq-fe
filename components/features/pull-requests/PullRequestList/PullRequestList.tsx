"use client";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import StateStatus from "@/components/shared/state-status";
import Icon from "@/components/ui/icon/Icon";
import {
  PULL_REQUEST_POLICY_LABEL,
  PULL_REQUEST_PROVIDER_ICON,
  PULL_REQUEST_STATUS_MAP,
} from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { usePullRequestList } from "@/lib/hooks/pull-requests/usePullRequestList";
import type {
  PullRequest,
  PullRequestFilter,
} from "@/lib/types/pull-request.types";
import { ROUTES } from "@/routes";

import FilterChip from "../FilterChip";
import PullRequestListSkeleton from "./PullRequestListSkeleton";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, PullRequest>();

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
                  <span className="font-mono">#{pr.externalId}</span>
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
        columnHelper.accessor("state", {
          header: "Status",
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
          cell: (info) => (
            <span className="block text-right font-mono text-[11.5px] text-text-secondary">
              {formatRelativeTime(info.getValue())}
            </span>
          ),
        }),
      ]),
    [],
  );

  const table = useTable({ features, columns, data: filteredData });

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
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-auto" />
            <col className="w-30" />
            <col className="w-30" />
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border-default"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={classNames(
                      "px-4.5 py-3 text-left font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase",
                      { "text-right": header.column.id === "updatedAt" },
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-border-row last:border-b-0 hover:bg-surface-hover"
                onClick={() =>
                  handleDetailPullRequest(
                    row.original.id,
                    row.original.repositoryId,
                  )
                }
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4.5 py-3.5">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* {filteredData.length === 0 ? (
        <StateStatus
          title={
            pullRequests.length === 0
              ? "Belum ada pull request untuk organisasi ini"
              : "Tidak ada pull request yang cocok dengan filter ini"
          }
          description={
            pullRequests.length === 0
              ? "Pull request akan muncul di sini setelah webhook menerima aktivitas baru."
              : undefined
          }
          action={
            pullRequests.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[12.5px] text-primary-400 hover:underline"
              >
                Tampilkan semua
              </button>
            )
          }
        />
      ) : (
       
      )} */}
    </div>
  );
});

PullRequestList.displayName = "PullRequestList";

export default PullRequestList;
