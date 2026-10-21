"use client";

import React from "react";

import Button from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import { getReviewSyncErrorMessage } from "@/const/pull-request.constant";
import type { ReviewSyncError } from "@/lib/types/pull-request.types";

interface ReviewSyncFailureProps {
  reviewId: string;
  reviewerName: string;
  error: ReviewSyncError | null;
  providerName: string;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: (reviewId: string) => void;
}

// A decision that never reached GitHub/GitLab. Review History only shows a
// badge, so the retry lives here.
const ReviewSyncFailure = React.memo(
  ({
    reviewId,
    reviewerName,
    error,
    providerName,
    canRetry,
    isRetrying,
    onRetry,
  }: ReviewSyncFailureProps) => (
    <Notice tone="warning" className="w-full">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span>
          <span className="font-semibold">{reviewerName}:</span>{" "}
          {getReviewSyncErrorMessage(error, providerName)}
        </span>
        {canRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={() => onRetry(reviewId)}
            isLoading={isRetrying}
            disabled={isRetrying}
          >
            Retry sync
          </Button>
        )}
      </span>
    </Notice>
  ),
);

ReviewSyncFailure.displayName = "ReviewSyncFailure";

export default ReviewSyncFailure;
