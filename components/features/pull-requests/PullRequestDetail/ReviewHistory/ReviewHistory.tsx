"use client";

import React from "react";

import ReviewDecisionBadge from "@/components/shared/review-decision-badge";
import SectionCard from "@/components/shared/section-card";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { usePullRequestReviews } from "@/lib/hooks/pull-requests/usePullRequestReviews";
import type { ReviewSyncStatus } from "@/lib/types/pull-request.types";

interface ReviewHistoryProps {
  orgId: string;
  repoId: string;
  pullId: string;
}

const SYNC_LABEL: Record<
  ReviewSyncStatus,
  { label: string; tone: "gray" | "green" | "orange" }
> = {
  pending: { label: "Syncing", tone: "gray" },
  synced: { label: "Synced", tone: "green" },
  failed: { label: "Sync failed", tone: "orange" },
};

// Audit trail of decisions on this PR, newest first.
const ReviewHistory = React.memo(
  ({ orgId, repoId, pullId }: ReviewHistoryProps) => {
    const { data: reviews, isUnavailable } = usePullRequestReviews(
      orgId,
      repoId,
      pullId,
    );

    if (isUnavailable || !reviews || reviews.length === 0) return null;

    return (
      <SectionCard title="Review history" count={reviews.length}>
        <ol>
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex gap-3 border-b border-border-row px-5 py-3 last:border-b-0"
            >
              <Avatar
                name={review.reviewer?.name ?? "?"}
                src={review.reviewer?.avatarUrl}
                size="md"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-text-strong">
                    {review.reviewer?.name ?? "A former member"}
                  </span>
                  <ReviewDecisionBadge
                    decision={review.decision}
                    outdated={review.outdated}
                  />
                  {review.aiAssisted && (
                    <Badge tone="primary" weight="normal">
                      AI-Assisted
                    </Badge>
                  )}
                  <Badge
                    tone={SYNC_LABEL[review.sync.status].tone}
                    weight="normal"
                  >
                    {SYNC_LABEL[review.sync.status].label}
                  </Badge>
                  <span className="ml-auto text-[11px] text-text-muted">
                    {formatRelativeTime(review.createdAt)}
                  </span>
                </div>
                {review.body && (
                  <p className="text-[12.5px] leading-normal whitespace-pre-wrap text-text-nav">
                    {review.body}
                  </p>
                )}
                <span className="font-mono text-[10.5px] text-text-faint">
                  {review.headSha.slice(0, 7)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    );
  },
);

ReviewHistory.displayName = "ReviewHistory";

export default ReviewHistory;
