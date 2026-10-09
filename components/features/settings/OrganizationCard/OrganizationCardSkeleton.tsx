import React from "react";

import Skeleton from "@/components/ui/skeleton";

const OrganizationCardSkeleton = React.memo(() => {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-y-3">
      <Skeleton className="h-3 w-12 rounded" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-3.5 w-40 rounded" />
      </div>

      <Skeleton className="h-3 w-10 rounded" />
      <Skeleton className="h-3.5 w-56 rounded" />

      <Skeleton className="h-3 w-16 rounded" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-72 max-w-full rounded" />
      </div>
    </div>
  );
});

OrganizationCardSkeleton.displayName = "OrganizationCardSkeleton";

export default OrganizationCardSkeleton;
