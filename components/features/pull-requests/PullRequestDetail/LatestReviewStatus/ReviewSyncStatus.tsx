"use client";

import React from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Notice from "@/components/ui/notice";
import Spinner from "@/components/ui/spinner";
import { getReviewSyncErrorMessage } from "@/const/pull-request.constant";
import type { PullRequestReview } from "@/lib/types/pull-request.types";

interface ReviewSyncStatusProps {
  sync: PullRequestReview["sync"];
  providerName: string;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}

// Delivery of a Critiq review to GitHub/GitLab.
const ReviewSyncStatus = React.memo(
  ({
    sync,
    providerName,
    canRetry,
    isRetrying,
    onRetry,
  }: ReviewSyncStatusProps) => {
    if (sync.status === "pending") {
      return (
        <span className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
          <Spinner size={12} className="text-text-muted" />
          Syncing to {providerName}…
        </span>
      );
    }

    if (sync.status === "synced") {
      return (
        <span className="flex items-center gap-1.5 text-[11.5px] text-success-light">
          <Icon icon="TbCircleCheck" size={13} />
          Synced
        </span>
      );
    }

    return (
      <Notice tone="warning" className="w-full">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {getReviewSyncErrorMessage(sync.error, providerName)}
          {canRetry && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onRetry}
              isLoading={isRetrying}
              disabled={isRetrying}
            >
              Retry sync
            </Button>
          )}
        </span>
      </Notice>
    );
  },
);

ReviewSyncStatus.displayName = "ReviewSyncStatus";

export default ReviewSyncStatus;
