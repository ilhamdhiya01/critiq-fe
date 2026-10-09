import React from "react";

import SectionCard from "@/components/shared/section-card";
import Skeleton from "@/components/ui/skeleton";

const SKELETON_ROWS = [
  { title: "45%", message: "75%" },
  { title: "38%", message: "60%" },
  { title: "52%", message: "68%" },
];

const FlaggedIssuesSkeleton = React.memo(() => {
  return (
    <SectionCard
      title={<Skeleton className="h-3.5 w-36 rounded" />}
      meta={<Skeleton className="h-3 w-40 rounded" />}
    >
      {SKELETON_ROWS.map((row, index) => (
        <div
          key={index}
          className="flex items-start gap-3.5 border-b border-border-row px-5 py-3.5 last:border-b-0"
        >
          <Skeleton className="h-5 w-18 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 rounded" style={{ width: row.title }} />
            <Skeleton className="h-3 rounded" style={{ width: row.message }} />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border-subtle bg-raised px-5 py-2.5">
        <Skeleton className="h-2.5 w-48 rounded" />
        <Skeleton className="h-2.5 w-10 rounded" />
      </div>
    </SectionCard>
  );
});

FlaggedIssuesSkeleton.displayName = "FlaggedIssuesSkeleton";

export default FlaggedIssuesSkeleton;
