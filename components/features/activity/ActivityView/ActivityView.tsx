"use client";

import { useParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import EmptyState from "@/components/shared/empty-state";
import FilterChip from "@/components/shared/filter-chip";
import SectionMessage from "@/components/shared/section-message";
import Button from "@/components/ui/button";
import SegmentedControl from "@/components/ui/segmented-control";
import Skeleton from "@/components/ui/skeleton";
import {
  ACTIVITY_DECISION_TABS,
  ACTIVITY_MODE_OPTIONS,
} from "@/const/activity.constant";
import { groupActivityByDay } from "@/lib/helpers/activity.helper";
import { useOrgActivity } from "@/lib/hooks/activity/useOrgActivity";
import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";
import { useRepoProviders } from "@/lib/hooks/repositories/useRepoProviders";
import type {
  ActivityDecisionFilter,
  ActivityFilters,
  ActivityModeFilter,
} from "@/lib/types/activity.types";

import ActivityTimelineItem from "../ActivityTimelineItem";

const SKELETON_ROWS = 5;

const ActivityView = React.memo(() => {
  const orgId = useActiveOrgId();
  const { slug } = useParams<{ slug: string }>();
  const [decision, setDecision] = useState<ActivityDecisionFilter>("all");
  const [mode, setMode] = useState<ActivityModeFilter>("all");
  const filters = useMemo<ActivityFilters>(
    () => ({ decision, mode }),
    [decision, mode],
  );

  const providers = useRepoProviders(orgId);
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useOrgActivity(orgId, filters);

  // Counts follow the mode filter only, so page 1 is always right.
  const counts = data?.pages[0]?.data.counts;
  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.items) ?? [],
    [data],
  );
  // Grouped across every loaded page so a day split by a page boundary
  // stays one group.
  const groups = useMemo(() => groupActivityByDay(items), [items]);

  const handleLoadMore = useCallback(() => fetchNextPage(), [fetchNextPage]);
  const isFiltered = decision !== "all" || mode !== "all";
  const isEmpty = !isError && !isLoading && groups.length === 0;

  const renderTimeline = () => {
    if (isError) {
      return (
        <SectionMessage tone="danger">
          Couldn&apos;t load activity. Reload the page to try again.
        </SectionMessage>
      );
    }
    if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-3 w-20 rounded" />
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-9">
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-5">
            <h3 className="font-mono text-[11px] tracking-[.12em] text-text-muted uppercase">
              {group.label}
            </h3>
            <ol>
              {group.items.map((item, index) => (
                <ActivityTimelineItem
                  key={item.id}
                  item={item}
                  provider={providers.get(item.pull.repoId)}
                  slug={slug}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          {ACTIVITY_DECISION_TABS.map((tab) => (
            <FilterChip
              key={tab.value}
              variant="outlined"
              value={tab.value}
              label={tab.label}
              count={counts?.[tab.countKey] ?? 0}
              isActive={decision === tab.value}
              onSelect={setDecision}
            />
          ))}
        </div>
        <SegmentedControl
          options={ACTIVITY_MODE_OPTIONS}
          value={mode}
          onChange={setMode}
          ariaLabel="Review mode"
          fullWidth="mobile"
        />
      </div>

      {/* Empty: the page-size empty state replaces the card (it has its own). */}
      {isEmpty ? (
        <EmptyState
          size="page"
          icon="TbClock"
          title={isFiltered ? "No reviews match this filter" : "No reviews yet"}
          description={
            isFiltered
              ? "Try another decision or review mode."
              : "Approvals and change requests from your team show up here as soon as someone reviews a pull request."
          }
        />
      ) : (
        <div className="flex flex-col gap-6 rounded-lg border border-border-subtle bg-surface px-4 py-6 sm:px-7">
          {renderTimeline()}

          {hasNextPage && !isError && (
            <div className="flex justify-center border-t border-border-row pt-5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={handleLoadMore}
                isLoading={isFetchingNextPage}
                disabled={isFetchingNextPage}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ActivityView.displayName = "ActivityView";

export default ActivityView;
