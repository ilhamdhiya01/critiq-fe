import React from "react";

import PullRequestDiffSkeleton from "./PullRequestDiff/PullRequestDiffSkeleton";

const PullRequestDetailSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-4">
      <div className="animate-shimmer h-4 w-40 rounded" />

      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="animate-shimmer h-4 w-2/3 rounded" />
          <div className="animate-shimmer h-5 w-16 shrink-0 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="animate-shimmer h-5.5 w-28 rounded" />
          <div className="animate-shimmer h-5.5 w-32 rounded" />
          <div className="animate-shimmer h-5.5 w-24 rounded" />
          <div className="animate-shimmer h-5.5 w-36 rounded" />
          <div className="animate-shimmer h-5.5 w-20 rounded-full" />
        </div>
      </div>

      <PullRequestDiffSkeleton />
    </div>
  );
});

PullRequestDetailSkeleton.displayName = "PullRequestDetailSkeleton";

export default PullRequestDetailSkeleton;
