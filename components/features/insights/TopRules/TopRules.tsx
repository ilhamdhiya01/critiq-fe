"use client";

import classNames from "classnames";
import React, { useMemo } from "react";

import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Badge from "@/components/ui/badge";
import Skeleton from "@/components/ui/skeleton";
import {
  INSIGHTS_SOURCE_BAR,
  INSIGHTS_SOURCE_LABEL,
} from "@/const/insights.constant";
import { FINDING_SOURCE_STYLE } from "@/const/pull-request.constant";
import { getBarPercents } from "@/lib/helpers/insights.helper";
import { useInsights } from "@/lib/hooks/insights/useInsights";

interface TopRulesProps {
  orgId?: string;
}

const TopRules = React.memo(({ orgId }: TopRulesProps) => {
  const { data, isLoading, isError } = useInsights(orgId);
  const topRules = data?.topRules;

  const percents = useMemo(
    () => getBarPercents(topRules?.map((rule) => rule.count) ?? []),
    [topRules],
  );

  const renderBody = () => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load the top rules.
        </SectionMessage>
      );
    }
    if (isLoading || !topRules) {
      return (
        <div className="flex flex-col gap-4 px-5 py-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full rounded" />
          ))}
        </div>
      );
    }
    if (topRules.length === 0) {
      return (
        <SectionMessage>
          No critical findings in the last 30 days.
        </SectionMessage>
      );
    }

    return (
      <ul className="flex flex-col gap-4 px-5 py-4">
        {topRules.map((rule, index) => (
          <li
            key={rule.ruleId}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_2.5rem]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                title={rule.label}
                className="truncate text-[12.5px] text-text-nav"
              >
                {rule.label}
              </span>
              <Badge size="xs" palette={FINDING_SOURCE_STYLE[rule.source]}>
                {INSIGHTS_SOURCE_LABEL[rule.source]}
              </Badge>
            </div>
            <div
              aria-hidden
              className="col-span-2 row-start-2 h-2 overflow-hidden rounded-full bg-raised sm:col-span-1 sm:col-start-2 sm:row-start-auto"
            >
              <span
                data-testid="top-rule-bar"
                className={classNames(
                  "block h-full rounded-full",
                  INSIGHTS_SOURCE_BAR[rule.source],
                )}
                style={{ width: `${percents[index]}%` }}
              />
            </div>
            <span className="text-right font-mono text-[12.5px] font-semibold text-neutral-100 sm:col-start-3 sm:row-start-1">
              {rule.count}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SectionCard title="Top rules · last 30 days">{renderBody()}</SectionCard>
  );
});

TopRules.displayName = "TopRules";

export default TopRules;
