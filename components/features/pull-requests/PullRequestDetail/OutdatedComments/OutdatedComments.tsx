"use client";

import React from "react";

import SectionCard from "@/components/shared/section-card";
import { usePullRequestComments } from "@/lib/hooks/pull-requests/usePullRequestComments";
import type { CommentScope } from "@/lib/types/pull-request.types";

import CommentThreadView from "../CommentThreadView";

interface OutdatedCommentsProps {
  scope: CommentScope;
}

// Inline threads on an older head: their line may have moved, so they are
// listed here instead of being pinned to the current diff.
const OutdatedComments = React.memo(({ scope }: OutdatedCommentsProps) => {
  const { data } = usePullRequestComments(
    scope.orgId,
    scope.repoId,
    scope.pullId,
  );
  const threads = data?.outdated;
  if (!threads || threads.length === 0) return null;

  return (
    <SectionCard
      title="Outdated comments"
      count={threads.length}
      meta="Made on an earlier commit"
    >
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="flex flex-col gap-2.5 border-b border-border-row px-5 py-3.5 last:border-b-0"
        >
          <span className="font-mono text-[11.5px] wrap-anywhere text-text-muted">
            {thread.path}:{thread.line}
            {thread.side === "old" && " (removed line)"}
          </span>
          <CommentThreadView thread={thread} scope={scope} size="sm" />
        </div>
      ))}
    </SectionCard>
  );
});

OutdatedComments.displayName = "OutdatedComments";

export default OutdatedComments;
