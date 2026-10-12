import React from "react";

import Markdown from "@/components/shared/markdown";
import Avatar from "@/components/ui/avatar";
import Icon from "@/components/ui/icon/Icon";
import { formatRelativeTime } from "@/lib/helpers/date.helper";
import type {
  CommentScope,
  PullRequestComment,
} from "@/lib/types/pull-request.types";

import CommentSyncStatus from "./CommentSyncStatus";

const ORIGIN_META = {
  github: { icon: "FaGithub", label: "GitHub" },
  gitlab: { icon: "FaGitlab", label: "GitLab" },
} as const;

interface CommentItemProps {
  comment: PullRequestComment;
  scope: CommentScope;
  size?: "sm" | "md";
}

const CommentItem = React.memo(
  ({ comment, scope, size = "md" }: CommentItemProps) => {
    const origin =
      comment.origin === "critiq" ? null : ORIGIN_META[comment.origin];

    return (
      <div className="flex gap-3">
        <Avatar
          name={comment.author.name}
          src={comment.author.avatarUrl}
          size={size === "sm" ? "xs" : "md"}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-text-nav">
            <span className="font-semibold text-text-strong">
              {comment.author.name}
            </span>
            {origin && (
              <span className="flex items-center gap-1 text-text-muted">
                <Icon
                  icon={origin.icon}
                  size={11}
                  aria-label={origin.label}
                  role="img"
                />
                {comment.author.providerUsername &&
                  `@${comment.author.providerUsername}`}
              </span>
            )}
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-text-faint">(edited)</span>
            )}
          </span>

          {comment.deleted ? (
            <p className="text-[12.5px] text-text-faint italic">
              Comment deleted on {origin?.label ?? scope.providerName}
            </p>
          ) : (
            <Markdown>{comment.body}</Markdown>
          )}

          {comment.sync && (
            <CommentSyncStatus
              commentId={comment.id}
              sync={comment.sync}
              scope={scope}
            />
          )}
        </div>
      </div>
    );
  },
);

CommentItem.displayName = "CommentItem";

export default CommentItem;
