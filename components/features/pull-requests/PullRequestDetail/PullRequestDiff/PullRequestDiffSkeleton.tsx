import React from "react";

const SKELETON_LINE_WIDTHS = ["55%", "70%", "40%", "80%", "60%", "45%"];

const PullRequestDiffSkeleton = React.memo(() => {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <div className="animate-shimmer h-3.5 w-44 rounded" />
        <div className="animate-shimmer h-3 w-28 rounded" />
      </div>
      <div className="flex flex-col gap-2 px-5 py-3">
        {SKELETON_LINE_WIDTHS.map((width, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="animate-shimmer h-2.5 w-7 rounded" />
            <div className="animate-shimmer h-2.5 w-7 rounded" />
            <div className="animate-shimmer h-2.5 rounded" style={{ width }} />
          </div>
        ))}
      </div>
    </div>
  );
});

PullRequestDiffSkeleton.displayName = "PullRequestDiffSkeleton";

export default PullRequestDiffSkeleton;
