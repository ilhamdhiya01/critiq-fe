"use client";

import React from "react";

import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Skeleton from "@/components/ui/skeleton";
import {
  formatDurationHours,
  getReviewSplit,
} from "@/lib/helpers/dashboard.helper";
import { useDashboardSummary } from "@/lib/hooks/dashboard/useDashboardSummary";
import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";

const LABEL =
  "font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase";

// Shares the summary query with the KPI cards.
const ReviewStats = React.memo(() => {
  const orgId = useActiveOrgId();
  const { data: summary, isLoading, isError } = useDashboardSummary(orgId);

  const renderBody = () => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load review stats.
        </SectionMessage>
      );
    }
    if (isLoading || !summary) {
      return (
        <div className="flex flex-col gap-3 px-5 py-4">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      );
    }

    const { total, aiAssisted, manual, avgApproveHours } = summary.reviews30d;
    const split = getReviewSplit(total, aiAssisted);

    return (
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className={LABEL}>Total reviews</span>
          <span className="font-mono text-[28px] leading-none font-bold text-neutral-100">
            {total}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>AI-assisted vs manual</span>
          <div
            role="img"
            aria-label={
              split
                ? `${split.aiPercent}% AI-assisted, ${split.manualPercent}% manual`
                : "No reviews yet"
            }
            className="flex h-2 overflow-hidden rounded-full bg-raised"
          >
            {split && (
              <>
                <span
                  className="h-full bg-primary-500"
                  style={{ width: `${split.aiPercent}%` }}
                />
                <span
                  className="h-full bg-neutral-600"
                  style={{ width: `${split.manualPercent}%` }}
                />
              </>
            )}
          </div>
          {split ? (
            <div className="flex justify-between font-mono text-[11.5px]">
              <span className="text-primary-300">
                AI-assisted · {aiAssisted} ({split.aiPercent}%)
              </span>
              <span className="text-text-secondary">Manual · {manual}</span>
            </div>
          ) : (
            <span className="text-[11.5px] text-text-muted">
              No reviews yet
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-raised/40 px-3.5 py-3">
            <span className={LABEL}>Avg approve · AI</span>
            <span className="font-mono text-[18px] font-bold text-primary-200">
              {formatDurationHours(avgApproveHours.aiAssisted)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-raised/40 px-3.5 py-3">
            <span className={LABEL}>Avg approve · Manual</span>
            <span className="font-mono text-[18px] font-bold text-neutral-100">
              {formatDurationHours(avgApproveHours.manual)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionCard title="Reviews — Last 30 Days">{renderBody()}</SectionCard>
  );
});

ReviewStats.displayName = "ReviewStats";

export default ReviewStats;
