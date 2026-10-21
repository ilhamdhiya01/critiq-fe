"use client";

import React from "react";

import SectionMessage from "@/components/shared/section-message";
import StatCard from "@/components/shared/stat-card";
import TrendHint from "@/components/shared/trend-hint";
import Skeleton from "@/components/ui/skeleton";
import {
  formatDurationHours,
  getTurnaroundTrend,
} from "@/lib/helpers/dashboard.helper";
import { useDashboardSummary } from "@/lib/hooks/dashboard/useDashboardSummary";
import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";

const SummaryCards = React.memo(() => {
  const orgId = useActiveOrgId();
  const { data: summary, isLoading, isError } = useDashboardSummary(orgId);

  if (isError) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface">
        <SectionMessage tone="danger">
          Couldn&apos;t load the summary.
        </SectionMessage>
      </div>
    );
  }

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const { reviewTurnaround, openCritical, repositories } = summary;
  const trend = getTurnaroundTrend(
    reviewTurnaround.avgHours,
    reviewTurnaround.previousAvgHours,
  );

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      <StatCard
        label="Avg review turnaround"
        value={formatDurationHours(reviewTurnaround.avgHours)}
        hint={trend && <TrendHint {...trend}>vs last week</TrendHint>}
      />
      <StatCard
        label="Open critical issues"
        value={openCritical.count}
        isAlert={openCritical.count > 0}
        hint={`across ${openCritical.pullCount} open PR${openCritical.pullCount === 1 ? "" : "s"}`}
      />
      <StatCard
        label="Repositories monitored"
        value={repositories.count}
        hint={
          repositories.addedThisMonth > 0 && (
            <>
              <span className="font-mono font-semibold text-text-strong">
                +{repositories.addedThisMonth}
              </span>{" "}
              this month
            </>
          )
        }
      />
    </div>
  );
});

SummaryCards.displayName = "SummaryCards";

export default SummaryCards;
