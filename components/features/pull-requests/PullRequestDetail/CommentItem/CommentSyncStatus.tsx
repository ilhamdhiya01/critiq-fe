"use client";

import React from "react";

import FieldError from "@/components/ui/field-error";
import Icon from "@/components/ui/icon/Icon";
import { getCommentSyncErrorMessage } from "@/const/pull-request.constant";
import { useRetryCommentSync } from "@/lib/hooks/pull-requests/useRetryCommentSync";
import type {
  CommentScope,
  PullRequestComment,
} from "@/lib/types/pull-request.types";

interface CommentSyncStatusProps {
  commentId: string;
  sync: NonNullable<PullRequestComment["sync"]>;
  scope: CommentScope;
}

// Delivery of a Critiq comment to GitHub/GitLab; nothing once synced.
const CommentSyncStatus = React.memo(
  ({ commentId, sync, scope }: CommentSyncStatusProps) => {
    const { handleRetryCommentSync, isRetryingSync } = useRetryCommentSync(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );

    if (sync.status === "pending") {
      return (
        <span className="flex items-center gap-1 text-[11px] text-text-muted">
          <Icon icon="TbClock" size={11} />
          Sending to {scope.providerName}…
        </span>
      );
    }

    if (sync.status === "failed") {
      return (
        <FieldError tone="warning" className="flex-wrap">
          {getCommentSyncErrorMessage(sync.error, scope.providerName)}
          {scope.canComment && (
            <button
              type="button"
              onClick={() => handleRetryCommentSync(commentId)}
              disabled={isRetryingSync}
              className="cursor-pointer text-text-nav underline underline-offset-2 transition-colors hover:text-text-strong disabled:cursor-wait disabled:opacity-60"
            >
              Retry
            </button>
          )}
        </FieldError>
      );
    }

    return null;
  },
);

CommentSyncStatus.displayName = "CommentSyncStatus";

export default CommentSyncStatus;
