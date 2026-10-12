"use client";

import React, { useCallback } from "react";

import { useCreateComment } from "@/lib/hooks/pull-requests/useCreateComment";
import type { CommentScope, CommentSide } from "@/lib/types/pull-request.types";

import CommentForm from "../CommentForm";

interface DiffNewCommentProps {
  path: string;
  side: CommentSide;
  line: number;
  // The head commit the line belongs to.
  headSha: string;
  scope: CommentScope;
  onDone: () => void;
}

// Starts a new inline thread on one diff line.
const DiffNewComment = React.memo(
  ({ path, side, line, headSha, scope, onDone }: DiffNewCommentProps) => {
    const { handleCreateComment, isCreating, createError } = useCreateComment(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );

    const handleSubmit = useCallback(
      async (body: string) => {
        await handleCreateComment({
          body,
          inline: { path, line, side, headSha },
        });
        onDone();
      },
      [handleCreateComment, path, line, side, headSha, onDone],
    );

    return (
      <CommentForm
        onSubmit={handleSubmit}
        placeholder={`Komentari ${path}:${line}…`}
        submitLabel="Komentar"
        isSubmitting={isCreating}
        error={createError}
        onCancel={onDone}
        autoFocus
        rows={2}
      />
    );
  },
);

DiffNewComment.displayName = "DiffNewComment";

export default DiffNewComment;
