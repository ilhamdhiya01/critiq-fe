import React from "react";

const SKELETON_ROW_WIDTHS = [
  { title: "72%", meta: "45%" },
  { title: "58%", meta: "38%" },
  { title: "80%", meta: "50%" },
  { title: "64%", meta: "42%" },
  { title: "68%", meta: "35%" },
];

const PullRequestListSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="animate-shimmer h-7 w-16 rounded-md" />
        <div className="animate-shimmer h-7 w-19.5 rounded-md" />
        <div className="animate-shimmer h-7 w-29.5 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_130px_70px] border-b border-border-default px-4.5 py-3">
          <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
            Pull request
          </span>
          <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
            Status
          </span>
          <span className="text-right font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
            Updated
          </span>
        </div>

        {SKELETON_ROW_WIDTHS.map((widths, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_130px_70px] items-center border-b border-border-row px-4.5 py-3.5 last:border-b-0"
          >
            <div className="flex flex-col gap-1.5 pr-6">
              <div
                className="animate-shimmer h-2.5 rounded"
                style={{ width: widths.title }}
              />
              <div
                className="animate-shimmer h-2 rounded"
                style={{ width: widths.meta }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-default" />
              <div className="animate-shimmer h-2 w-16 rounded" />
            </div>
            <div className="animate-shimmer ml-auto h-2 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
});

PullRequestListSkeleton.displayName = "PullRequestListSkeleton";

export default PullRequestListSkeleton;
