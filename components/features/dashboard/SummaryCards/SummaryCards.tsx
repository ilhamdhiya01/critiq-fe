"use client";

import classNames from "classnames";
import React from "react";

import SectionMessage from "@/components/shared/section-message";
import StatCard from "@/components/shared/stat-card";
import Skeleton from "@/components/ui/skeleton";
import {
  formatDurationHours,
  getTurnaroundTrend,
} from "@/lib/helpers/dashboard.helper";
import { useDashboardSummary } from "@/lib/hooks/dashboard/useDashboardSummary";

const TREND_ARROW = { down: "↓", up: "↑", same: "→" } as const;

interface SummaryCardsProps {
  orgId?: string;
}

const SummaryCards = React.memo(({ orgId }: SummaryCardsProps) => {
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
        hint={
          trend && (
            <>
              <span
                className={classNames("font-mono font-semibold", {
                  "text-success-light": trend.tone === "good",
                  "text-danger-light": trend.tone === "bad",
                  "text-text-secondary": trend.tone === "neutral",
                })}
              >
                {TREND_ARROW[trend.direction]} {trend.text}
              </span>{" "}
              vs last week
            </>
          )
        }
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
              <span className="font-mono font-semibold text-info-light">
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
