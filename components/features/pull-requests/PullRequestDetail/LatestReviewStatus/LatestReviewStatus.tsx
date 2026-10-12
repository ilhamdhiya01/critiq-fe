"use client";

import React, { useCallback } from "react";

import ReviewDecisionBadge from "@/components/shared/review-decision-badge";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import { REVIEW_OUTDATED_LABEL } from "@/const/pull-request.constant";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import { useRetryReviewSync } from "@/lib/hooks/pull-requests/useRetryReviewSync";
import type { PullRequestReview } from "@/lib/types/pull-request.types";

import ReviewSyncStatus from "./ReviewSyncStatus";

interface LatestReviewStatusProps {
  orgId: string;
  repoId: string;
  pullId: string;
  review: PullRequestReview;
  providerName: string;
  // Admin/Reviewer may resend a failed sync.
  canRetry: boolean;
}

const DECISION_VERB = {
  approve: "Approved by",
  request_changes: "Changes requested by",
} as const;

const LatestReviewStatus = React.memo(
  ({
    orgId,
    repoId,
    pullId,
    review,
    providerName,
    canRetry,
  }: LatestReviewStatusProps) => {
    const { handleRetrySync, isRetrying } = useRetryReviewSync(
      orgId,
      repoId,
      pullId,
    );
    const handleRetry = useCallback(
      () => handleRetrySync(review.id),
      [handleRetrySync, review.id],
    );
    const reviewerName = review.reviewer?.name ?? "a former member";

    return (
      <div className="flex flex-col gap-2.5 border-t border-border-row pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ReviewDecisionBadge decision={review.decision} />
          <span className="flex items-center gap-1.5 text-xs text-text-nav">
            {review.reviewer && (
              <Avatar
                name={review.reviewer.name}
                src={review.reviewer.avatarUrl}
              />
            )}
            {DECISION_VERB[review.decision]} {reviewerName}
            <span className="text-text-faint">·</span>
            <span className="text-text-muted">
              {formatRelativeTime(review.createdAt)}
            </span>
          </span>
          {review.outdated && (
            <Badge tone="gray" weight="normal">
              {REVIEW_OUTDATED_LABEL}
            </Badge>
          )}
          {review.sync.status !== "failed" && (
            <span className="ml-auto">
              <ReviewSyncStatus
                sync={review.sync}
                providerName={providerName}
                canRetry={canRetry}
                isRetrying={isRetrying}
                onRetry={handleRetry}
              />
            </span>
          )}
        </div>
        {review.sync.status === "failed" && (
          <ReviewSyncStatus
            sync={review.sync}
            providerName={providerName}
            canRetry={canRetry}
            isRetrying={isRetrying}
            onRetry={handleRetry}
          />
        )}
      </div>
    );
  },
);

LatestReviewStatus.displayName = "LatestReviewStatus";

export default LatestReviewStatus;
