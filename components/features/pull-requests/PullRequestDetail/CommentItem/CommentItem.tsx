import classNames from "classnames";
import React from "react";

import { getAvatarColor, getInitials } from "@/lib/helpers/avatar.helper";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import type { PullRequestComment } from "@/lib/types/pull-request.types";

interface CommentItemProps {
  comment: PullRequestComment;
  size?: "sm" | "md";
}

const CommentItem = React.memo(({ comment, size = "md" }: CommentItemProps) => {
  return (
    <div className="flex gap-3">
      <span
        className={classNames(
          "flex shrink-0 items-center justify-center rounded-full font-bold text-neutral-50",
          getAvatarColor(comment.author),
          size === "sm" ? "h-5.5 w-5.5 text-[9px]" : "h-7 w-7 text-[10px]",
        )}
      >
        {getInitials(comment.author)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-text-nav">
          {comment.author}
          <span className="text-text-muted"> · </span>
          <span className="text-text-muted">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </span>
        <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-text-secondary">
          {comment.body}
        </p>
      </div>
    </div>
  );
});

CommentItem.displayName = "CommentItem";

export default CommentItem;
