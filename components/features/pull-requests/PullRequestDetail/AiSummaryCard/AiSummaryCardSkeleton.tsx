import React from "react";

import Skeleton from "@/components/ui/skeleton";

const AiSummaryCardSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary-500/45 bg-surface-tinted px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-7 w-28 rounded-[7px]" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-full" />
      </div>
    </div>
  );
});

AiSummaryCardSkeleton.displayName = "AiSummaryCardSkeleton";

export default AiSummaryCardSkeleton;
