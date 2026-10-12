"use client";

import React, { useCallback, useState } from "react";

import { useCreateComment } from "@/lib/hooks/pull-requests/useCreateComment";
import type {
  CommentScope,
  CommentThread,
} from "@/lib/types/pull-request.types";

import CommentForm from "../CommentForm";
import CommentItem from "../CommentItem";

interface CommentThreadViewProps {
  thread: CommentThread;
  scope: CommentScope;
  size?: "sm" | "md";
}

// Root comment, its replies, and a reply form (Admin/Reviewer).
const CommentThreadView = React.memo(
  ({ thread, scope, size = "md" }: CommentThreadViewProps) => {
    const [isReplying, setIsReplying] = useState(false);
    const { handleCreateComment, isCreating, createError, clearCreateError } =
      useCreateComment(scope.orgId, scope.repoId, scope.pullId);
    const [root, ...replies] = thread.comments;

    const handleReply = useCallback(
      async (body: string) => {
        // Replies inherit the thread's position — never send `inline`.
        await handleCreateComment({ body, parentId: thread.id });
        setIsReplying(false);
      },
      [handleCreateComment, thread.id],
    );

    const handleCancel = useCallback(() => {
      setIsReplying(false);
      clearCreateError();
    }, [clearCreateError]);

    if (!root) return null;

    return (
      <div className="flex flex-col gap-2.5">
        <CommentItem comment={root} scope={scope} size={size} />
        {replies.length > 0 && (
          <div className="ml-3 flex flex-col gap-2.5 border-l border-border-row pl-4">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                scope={scope}
                size="sm"
              />
            ))}
          </div>
        )}
        {scope.canComment &&
          (isReplying ? (
            <div className="ml-3 pl-4">
              <CommentForm
                onSubmit={handleReply}
                placeholder="Tulis balasan…"
                submitLabel="Balas"
                isSubmitting={isCreating}
                error={createError}
                onCancel={handleCancel}
                autoFocus
                rows={2}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="ml-3 w-fit cursor-pointer pl-4 text-[11.5px] text-text-muted transition-colors hover:text-text-strong"
            >
              Balas
            </button>
          ))}
      </div>
    );
  },
);

CommentThreadView.displayName = "CommentThreadView";

export default CommentThreadView;
