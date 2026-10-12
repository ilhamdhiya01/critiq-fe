"use client";

import React, { useCallback } from "react";

import SectionCard from "@/components/shared/section-card";
import SectionMessage from "@/components/shared/section-message";
import Skeleton from "@/components/ui/skeleton";
import { useCreateComment } from "@/lib/hooks/pull-requests/useCreateComment";
import { usePullRequestComments } from "@/lib/hooks/pull-requests/usePullRequestComments";
import type { CommentScope } from "@/lib/types/pull-request.types";

import CommentForm from "../CommentForm";
import CommentThreadView from "../CommentThreadView";

interface PullRequestDiscussionProps {
  scope: CommentScope;
}

// General (non-inline) comments, synced both ways with the code host.
const PullRequestDiscussion = React.memo(
  ({ scope }: PullRequestDiscussionProps) => {
    const { data, isLoading, isError } = usePullRequestComments(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );
    const { handleCreateComment, isCreating, createError } = useCreateComment(
      scope.orgId,
      scope.repoId,
      scope.pullId,
    );
    const threads = data?.general;

    const handleSubmit = useCallback(
      (body: string) => handleCreateComment({ body }),
      [handleCreateComment],
    );

    const renderThreads = () => {
      if (isError) {
        return (
          <SectionMessage tone="danger">
            Gagal memuat komentar. Coba muat ulang halaman.
          </SectionMessage>
        );
      }
      if (isLoading) {
        return (
          <div className="flex flex-col gap-2 px-5 py-4">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        );
      }
      if (!threads || threads.length === 0) {
        return (
          <div className="border-b border-border-row px-5 py-4 text-xs text-text-muted">
            Belum ada komentar.
          </div>
        );
      }
      return threads.map((thread) => (
        <div key={thread.id} className="border-b border-border-row px-5 py-3.5">
          <CommentThreadView thread={thread} scope={scope} />
        </div>
      ));
    };

    return (
      <SectionCard title="Diskusi" count={threads?.length}>
        {renderThreads()}
        {scope.canComment && (
          <div className="px-5 py-3.5">
            <CommentForm
              onSubmit={handleSubmit}
              placeholder="Tulis komentar…"
              submitLabel="Komentar"
              isSubmitting={isCreating}
              error={createError}
            />
          </div>
        )}
      </SectionCard>
    );
  },
);

PullRequestDiscussion.displayName = "PullRequestDiscussion";

export default PullRequestDiscussion;
