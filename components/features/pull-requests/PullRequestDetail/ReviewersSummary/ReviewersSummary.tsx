"use client";

import React, { useMemo } from "react";

import Avatar from "@/components/ui/avatar";
import Icon from "@/components/ui/icon/Icon";
import {
  DELETED_REVIEWER_NAME,
  REVIEW_DECISION_LABEL,
  REVIEWER_OUTDATED_TOOLTIP,
} from "@/const/pull-request.constant";
import { getReviewersOverview } from "@/lib/helpers/pull-request.helper";
import { useRetryReviewSync } from "@/lib/hooks/pull-requests/useRetryReviewSync";
import type { PullRequestReviewer } from "@/lib/types/pull-request.types";

import ReviewSyncFailure from "./ReviewSyncFailure";

const MAX_AVATARS = 5;

interface ReviewersSummaryProps {
  orgId: string;
  repoId: string;
  pullId: string;
  // Already sorted: current commit first, then outdated.
  reviewers: PullRequestReviewer[];
  providerName: string;
  // Admin/Reviewer may resend a failed sync.
  canRetry: boolean;
}

// One line: decisions on the current commit plus stacked avatars. The full
// per-reviewer trail is in Review History.
const ReviewersSummary = React.memo(
  ({
    orgId,
    repoId,
    pullId,
    reviewers,
    providerName,
    canRetry,
  }: ReviewersSummaryProps) => {
    const { handleRetrySync, retryingReviewId } = useRetryReviewSync(
      orgId,
      repoId,
      pullId,
    );
    const { overview, failed } = useMemo(
      () => ({
        overview: getReviewersOverview(reviewers),
        failed: reviewers.filter((entry) => entry.sync.status === "failed"),
      }),
      [reviewers],
    );
    const { current, approvals, changeRequests, outdated } = overview;
    const hiddenCount = current.length - MAX_AVATARS;

    const renderCounts = () => {
      if (current.length === 0) {
        return (
          <span className="text-text-muted">
            No reviews on the latest commit
          </span>
        );
      }
      return (
        <span className="flex items-center gap-2 font-mono">
          {approvals > 0 && (
            <span className="flex items-center gap-1 text-success-light">
              <Icon icon="TbCheck" size={14} /> {approvals} approval
              {approvals === 1 ? "" : "s"}
            </span>
          )}
          {approvals > 0 && changeRequests > 0 && (
            <span className="text-text-faint">·</span>
          )}
          {changeRequests > 0 && (
            <span className="flex items-center gap-1 text-warning-light">
              <Icon icon="TbX" size={14} /> {changeRequests} changes requested
            </span>
          )}
        </span>
      );
    };

    return (
      <div className="flex flex-col gap-2.5 border-t border-border-row pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {reviewers.length === 0 ? (
            <span className="text-text-muted">No reviews yet</span>
          ) : (
            <>
              {current.length > 0 && (
                <span className="flex -space-x-2.5">
                  {current.slice(0, MAX_AVATARS).map((entry) => {
                    const name = entry.reviewer?.name ?? DELETED_REVIEWER_NAME;
                    const label = `${name} · ${REVIEW_DECISION_LABEL[entry.decision]}`;
                    return (
                      <Avatar
                        key={entry.reviewId}
                        name={entry.reviewer?.name ?? "?"}
                        src={entry.reviewer?.avatarUrl}
                        size="sm"
                        role="img"
                        title={label}
                        aria-label={label}
                        className="ring-2 ring-surface"
                      />
                    );
                  })}
                  {hiddenCount > 0 && (
                    <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-raised px-1 font-mono text-[10.5px] text-text-secondary ring-2 ring-surface">
                      +{hiddenCount}
                    </span>
                  )}
                </span>
              )}
              {renderCounts()}
              {outdated > 0 && (
                <span
                  title={REVIEWER_OUTDATED_TOOLTIP}
                  className="text-[11px] text-text-faint"
                >
                  {outdated} outdated
                </span>
              )}
            </>
          )}
        </div>
        {failed.map((entry) => (
          <ReviewSyncFailure
            key={entry.reviewId}
            reviewId={entry.reviewId}
            reviewerName={entry.reviewer?.name ?? DELETED_REVIEWER_NAME}
            error={entry.sync.error}
            providerName={providerName}
            canRetry={canRetry}
            isRetrying={retryingReviewId === entry.reviewId}
            onRetry={handleRetrySync}
          />
        ))}
      </div>
    );
  },
);

ReviewersSummary.displayName = "ReviewersSummary";

export default ReviewersSummary;
