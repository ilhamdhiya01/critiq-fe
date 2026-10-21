"use client";

import { createColumnHelper, useTable } from "@tanstack/react-table";
import classNames from "classnames";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";

import EmptyState from "@/components/shared/empty-state";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import LanguageDot from "@/components/ui/language-dot";
import Skeleton from "@/components/ui/skeleton";
import DataTable from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { repoName } from "@/lib/helpers/repository.helper";
import { sortableFeatures } from "@/lib/helpers/table.helper";
import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";
import { useOrgRepositories } from "@/lib/hooks/repositories/useOrgRepositories";
import type { OrgRepository } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";

const EMPTY_REPOS: OrgRepository[] = [];
const columnHelper = createColumnHelper<
  typeof sortableFeatures,
  OrgRepository
>();

// Module level: one stable element for the memoised table.
const NO_REPOSITORIES = (
  <EmptyState
    icon="TbFolder"
    title="No repositories connected yet"
    description="Connected repositories and their open critical issues show up here."
  />
);

const MonitoredRepositories = React.memo(() => {
  const orgId = useActiveOrgId();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { data: repos, isLoading, isError } = useOrgRepositories(orgId);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("path", {
          header: "Repository",
          enableSorting: false,
          cell: (info) => (
            <span
              title={info.getValue()}
              className="flex min-w-0 items-center gap-2.5"
            >
              <LanguageDot language={info.row.original.language} size="sm" />
              <span className="truncate font-mono text-[12.5px] text-text-strong">
                {repoName(info.getValue())}
              </span>
            </span>
          ),
        }),
        columnHelper.accessor("openCriticalCount", {
          header: "Critical in open PRs",
          enableSorting: false,
          cell: (info) => {
            const count = info.getValue();
            if (count === undefined) {
              return <span className="text-text-muted">—</span>;
            }
            return (
              <span
                className={classNames("font-mono text-[12.5px]", {
                  "text-danger-light": count > 0,
                  "text-text-muted": count === 0,
                })}
              >
                {count}
              </span>
            );
          },
        }),
        columnHelper.accessor("lastScanAt", {
          header: "Last PR scan",
          enableSorting: false,
          cell: (info) => {
            const lastScanAt = info.getValue();
            return (
              <span className="text-[12px] text-text-secondary">
                {lastScanAt ? formatRelativeTime(lastScanAt) : "Never"}
              </span>
            );
          },
        }),
      ]),
    [],
  );

  const table = useTable({
    features: sortableFeatures,
    columns,
    data: repos ?? EMPTY_REPOS,
  });

  const handleRowClick = useCallback(
    (repo: OrgRepository) =>
      router.push(ROUTES.repositoryDetail(slug, repo.id)),
    [router, slug],
  );

  return (
    <SectionCard
      title="Monitored Repositories"
      meta={repos ? `${repos.length} connected` : undefined}
    >
      {isError ? (
        <SectionMessage tone="danger">
          Couldn&apos;t load repositories.
        </SectionMessage>
      ) : isLoading ? (
        <div className="flex flex-col gap-2 px-5 py-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>
      ) : (
        <DataTable
          table={table}
          columnCount={columns.length}
          onRowClick={handleRowClick}
          emptyMessage={NO_REPOSITORIES}
          minWidth={480}
        />
      )}
    </SectionCard>
  );
});

MonitoredRepositories.displayName = "MonitoredRepositories";

export default MonitoredRepositories;
