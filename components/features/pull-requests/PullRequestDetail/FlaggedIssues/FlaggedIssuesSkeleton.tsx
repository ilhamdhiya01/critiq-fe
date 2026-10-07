import React from "react";

const SKELETON_ROWS = [
  { title: "45%", message: "75%" },
  { title: "38%", message: "60%" },
  { title: "52%", message: "68%" },
];

const FlaggedIssuesSkeleton = React.memo(() => {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5">
        <div className="animate-shimmer h-3.5 w-36 rounded" />
        <div className="animate-shimmer h-3 w-40 rounded" />
      </div>

      {SKELETON_ROWS.map((row, index) => (
        <div
          key={index}
          className="flex items-start gap-3.5 border-b border-border-row px-5 py-3.5 last:border-b-0"
        >
          <div className="animate-shimmer h-5 w-18 shrink-0 rounded-full" />
          <div className="animate-shimmer h-5 w-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div
              className="animate-shimmer h-3 rounded"
              style={{ width: row.title }}
            />
            <div
              className="animate-shimmer h-3 rounded"
              style={{ width: row.message }}
            />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border-subtle bg-raised px-5 py-2.5">
        <div className="animate-shimmer h-2.5 w-48 rounded" />
        <div className="animate-shimmer h-2.5 w-10 rounded" />
      </div>
    </div>
  );
});

FlaggedIssuesSkeleton.displayName = "FlaggedIssuesSkeleton";

export default FlaggedIssuesSkeleton;
