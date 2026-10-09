"use client";

import classNames from "classnames";
import Link from "next/link";
import React from "react";

import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Avatar from "@/components/ui/avatar";
import Skeleton from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { EFFECTIVE_POLICY_LABEL } from "@/const/repository.constant";
import { useRepoPulls } from "@/lib/hooks/repositories/useRepoPulls";
import type { PullRequest } from "@/lib/types/pull-request.types";
import { ROUTES } from "@/routes";

const GRID =
  "grid grid-cols-[minmax(0,2.8fr)_minmax(0,1.4fr)_80px_120px] items-center gap-3";

interface RepoPullsTableProps {
  orgId: string;
  repoId: string;
  slug: string;
}

const CriticalCell = ({ pull }: { pull: PullRequest }) => {
  if (pull.activeScan) {
    return (
      <span aria-label="Scanning" title="Scanning…" className="flex">
        <Spinner size={14} />
      </span>
    );
  }
  if (!pull.latestScan) {
    return <span className="text-text-muted">—</span>;
  }
  const count = pull.latestScan.criticalCount;
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
};

const RepoPullsTable = React.memo(
  ({ orgId, repoId, slug }: RepoPullsTableProps) => {
    const { data: pulls, isLoading, isError } = useRepoPulls(orgId, repoId);

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
          <SectionMessage>No pull requests yet.</SectionMessage>
        ) : (
          <>
            <div
              className={classNames(
                GRID,
                "border-b border-border-row px-5 py-2.5 font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase",
              )}
            >
              <span>Title</span>
              <span>Author</span>
              <span>Critical</span>
              <span>Review policy</span>
            </div>
            {pulls.map((pull) => (
              <Link
                key={pull.id}
                href={ROUTES.pullRequestDetail(slug, pull.id, repoId)}
                className={classNames(
                  GRID,
                  "border-b border-border-row px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-hover",
                )}
              >
                <span className="truncate font-mono text-[12.5px] text-text-strong">
                  {pull.title}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {pull.authorUsername ? (
                    <>
                      <Avatar name={pull.authorUsername} />
                      <span className="truncate text-[12px] text-text-secondary">
                        {pull.authorUsername}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </span>
                <CriticalCell pull={pull} />
                <span className="font-mono text-[11.5px] text-text-secondary">
                  {EFFECTIVE_POLICY_LABEL[pull.effectivePolicy]}
                </span>
              </Link>
            ))}
          </>
        )}
      </SectionCard>
    );
  },
);

RepoPullsTable.displayName = "RepoPullsTable";

export default RepoPullsTable;
