"use client";

import React from "react";

import SectionMessage from "@/components/shared/section-message";
import StatCard from "@/components/shared/stat-card";
import TrendHint from "@/components/shared/trend-hint";
import Skeleton from "@/components/ui/skeleton";
import {
  INSIGHTS_COMPARISON,
  MTTR_TOOLTIP,
  RESOLVED_TOOLTIP,
} from "@/const/insights.constant";
import {
  formatMttr,
  getMttrTrend,
  getPercentTrend,
  getResolvedTrend,
  type InsightsTrend,
} from "@/lib/helpers/insights.helper";
import { useInsights } from "@/lib/hooks/insights/useInsights";

const renderTrend = (trend: InsightsTrend | null) => {
  if (!trend) return null;
  if (trend.kind === "new") {
    return (
      <TrendHint direction="up" tone={trend.tone} text="new">
        · none in the previous 30 days
      </TrendHint>
    );
  }
  if (trend.kind === "same") {
    return (
      <TrendHint direction="same" tone="neutral" text="no change">
        {INSIGHTS_COMPARISON}
      </TrendHint>
    );
  }
  return (
    <TrendHint direction={trend.direction} tone={trend.tone} text={trend.text}>
      {INSIGHTS_COMPARISON}
    </TrendHint>
  );
};

interface InsightsSummaryCardsProps {
  orgId?: string;
}

const InsightsSummaryCards = React.memo(
  ({ orgId }: InsightsSummaryCardsProps) => {
    const { data, isLoading, isError } = useInsights(orgId);

    if (isError) {
      return (
        <div className="rounded-lg border border-border-subtle bg-surface">
          <SectionMessage tone="danger">
            Couldn&apos;t load insights.
          </SectionMessage>
        </div>
      );
    }

    if (isLoading || !data) {
      return (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      );
    }

    const { criticalFound, criticalResolved, meanTimeToResolveHours } = data;

    return (
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <StatCard
          label="Critical issues found · last 30 days"
          value={criticalFound.last30d}
          hint={renderTrend(
            getPercentTrend(criticalFound.last30d, criticalFound.previous30d),
          )}
        />
        <StatCard
          label="Critical resolved · last 30 days"
          tooltip={RESOLVED_TOOLTIP}
          value={criticalResolved.last30d}
          hint={renderTrend(
            getResolvedTrend(
              criticalResolved.last30d,
              criticalResolved.previous30d,
            ),
          )}
        />
        <StatCard
          label="Mean time to resolve"
          tooltip={MTTR_TOOLTIP}
          value={formatMttr(meanTimeToResolveHours.last30d)}
          hint={renderTrend(
            getMttrTrend(
              meanTimeToResolveHours.last30d,
              meanTimeToResolveHours.previous30d,
            ),
          )}
        />
      </div>
    );
  },
);

InsightsSummaryCards.displayName = "InsightsSummaryCards";

export default InsightsSummaryCards;
