"use client";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import StateStatus from "@/components/shared/state-status";
import Icon from "@/components/ui/icon/Icon";
import { DUMMY_PULL_REQUESTS } from "@/const/pull-requests.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import type {
  PullRequest,
  PullRequestFilter,
} from "@/lib/types/pull-request.types";

import FilterChip from "../FilterChip";

const features = tableFeatures({});
const columnHelper = createColumnHelper<typeof features, PullRequest>();

const FILTER_OPTIONS: { value: PullRequestFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "approved", label: "Approved" },
  { value: "needs_attention", label: "Needs attention" },
];

const STATUS_MAP = {
  open: { label: "Open", dot: "bg-text-muted", text: "text-text-secondary" },
  approved: { label: "Approved", dot: "bg-success", text: "text-success" },
  changes_requested: {
    label: "Changes requested",
    dot: "bg-danger",
    text: "text-danger",
  },
} as const;

const matchesFilter = (pr: PullRequest, filter: PullRequestFilter): boolean => {
  if (filter === "all") return true;
  if (filter === "needs_attention") return pr.status === "changes_requested";
  return pr.status === filter;
};

const PullRequestList = React.memo(() => {
  const [activeFilter, setActiveFilter] = useState<PullRequestFilter>("all");

  const filteredData = useMemo(
    () => DUMMY_PULL_REQUESTS.filter((pr) => matchesFilter(pr, activeFilter)),
    [activeFilter],
  );

  const counts = useMemo(
    () => ({
      all: DUMMY_PULL_REQUESTS.length,
      open: DUMMY_PULL_REQUESTS.filter((pr) => matchesFilter(pr, "open"))
        .length,
      approved: DUMMY_PULL_REQUESTS.filter((pr) =>
        matchesFilter(pr, "approved"),
      ).length,
      needs_attention: DUMMY_PULL_REQUESTS.filter((pr) =>
        matchesFilter(pr, "needs_attention"),
      ).length,
    }),
    [],
  );

  const handleSelectFilter = useCallback(
    (value: PullRequestFilter) => setActiveFilter(value),
    [],
  );
  const handleResetFilter = useCallback(() => setActiveFilter("all"), []);

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
                <span className="truncate font-mono text-[12.5px] text-neutral-100">
                  {pr.title}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-text-secondary">
                  <Icon
                    icon={pr.source === "github" ? "FaGithub" : "FaGitlab"}
                    size={11}
                    className="shrink-0"
                  />
                  <span className="font-mono">{pr.number}</span>
                  <span>·</span>
                  <span className="truncate font-mono">
                    {pr.repository} → {pr.targetBranch}
                  </span>
                  <span>·</span>
                  <span className="truncate">{pr.author}</span>
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("criticalCount", {
          header: "Critical",
          cell: (info) => {
            const count = info.getValue();
            return count > 0 ? (
              <span className="font-mono text-[12px] text-danger">
                {count} critical
              </span>
            ) : (
              <span className="font-mono text-[12px] text-text-muted">—</span>
            );
          },
        }),
        columnHelper.accessor("reviewMode", {
          header: "Review",
          cell: (info) => {
            const mode = info.getValue();
            return (
              <span
                className={classNames("font-mono text-[12px]", {
                  "text-primary-400": mode === "ai_assisted",
                  "text-text-secondary": mode === "manual",
                })}
              >
                {mode === "ai_assisted" ? "AI-Assisted" : "Manual"}
              </span>
            );
          },
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => {
            const { label, dot, text } = STATUS_MAP[info.getValue()];
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

      {filteredData.length === 0 ? (
        <StateStatus
          title="No pull requests match this filter."
          action={
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-[12.5px] text-primary-400 hover:underline"
            >
              Show all
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-96" />
              <col className="w-30" />
              <col className="w-30" />
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
      )}
    </div>
  );
});

PullRequestList.displayName = "PullRequestList";

export default PullRequestList;
