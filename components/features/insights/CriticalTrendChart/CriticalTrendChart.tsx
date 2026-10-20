"use client";

import React, { useCallback, useMemo } from "react";

import LineAreaChart, { type ChartSeries } from "@/components/shared/charts";
import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Skeleton from "@/components/ui/skeleton";
import {
  INSIGHTS_SOURCE_COLOR,
  INSIGHTS_SOURCE_LABEL,
} from "@/const/insights.constant";
import { formatWeekRange } from "@/lib/helpers/insights.helper";
import {
  INSIGHTS_DEFAULT_WEEKS,
  useInsights,
} from "@/lib/hooks/insights/useInsights";

const CHART_HEIGHT = 260;

interface CriticalTrendChartProps {
  orgId?: string;
}

const CriticalTrendChart = React.memo(({ orgId }: CriticalTrendChartProps) => {
  const { data, isLoading, isError } = useInsights(orgId);
  const weekly = data?.weekly;

  const series = useMemo<ChartSeries[]>(
    () => [
      {
        key: "static",
        label: INSIGHTS_SOURCE_LABEL.STATIC,
        color: INSIGHTS_SOURCE_COLOR.STATIC,
        values: weekly?.map((week) => week.static) ?? [],
      },
      {
        key: "ai",
        label: INSIGHTS_SOURCE_LABEL.AI,
        color: INSIGHTS_SOURCE_COLOR.AI,
        values: weekly?.map((week) => week.ai) ?? [],
      },
    ],
    [weekly],
  );
  const labels = useMemo(
    () => weekly?.map((_, index) => `W${index + 1}`) ?? [],
    [weekly],
  );
  const formatTooltip = useCallback(
    (index: number) =>
      weekly?.[index] ? formatWeekRange(weekly[index].weekStart) : null,
    [weekly],
  );

  const renderBody = () => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load the trend.
        </SectionMessage>
      );
    }
    if (isLoading || !weekly) {
      return (
        <div className="px-5 py-4">
          <Skeleton className="h-65 w-full rounded-md" />
        </div>
      );
    }
    if (weekly.length === 0) {
      return <SectionMessage>No scans yet.</SectionMessage>;
    }

    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        <ul className="flex items-center gap-4 font-mono text-[11px] text-text-secondary">
          {series.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
        <LineAreaChart
          series={series}
          labels={labels}
          height={CHART_HEIGHT}
          formatTooltip={formatTooltip}
          ariaLabel={`Critical issues found per week over the last ${weekly.length} weeks, static and AI`}
          emptyMessage="No critical issues in this period"
        />
      </div>
    );
  };

  return (
    <SectionCard
      title="Critical Issues Found Over Time"
      meta={`Last ${weekly?.length || INSIGHTS_DEFAULT_WEEKS} weeks`}
    >
      {renderBody()}
    </SectionCard>
  );
});

CriticalTrendChart.displayName = "CriticalTrendChart";

export default CriticalTrendChart;
