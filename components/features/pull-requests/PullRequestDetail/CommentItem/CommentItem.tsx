import React from "react";

import Avatar from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import type { PullRequestComment } from "@/lib/types/pull-request.types";

interface CommentItemProps {
  comment: PullRequestComment;
  size?: "sm" | "md";
}

const CommentItem = React.memo(({ comment, size = "md" }: CommentItemProps) => {
  return (
    <div className="flex gap-3">
      <Avatar name={comment.author} size={size === "sm" ? "xs" : "md"} />
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
