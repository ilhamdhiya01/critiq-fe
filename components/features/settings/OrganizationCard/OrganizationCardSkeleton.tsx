import React from "react";

import DetailRow from "@/components/shared/detail-row";
import Skeleton from "@/components/ui/skeleton";

const OrganizationCardSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-3">
      <DetailRow label={<Skeleton className="h-3 w-12 rounded" />}>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-3.5 w-40 rounded" />
        </div>
      </DetailRow>
      <DetailRow label={<Skeleton className="h-3 w-10 rounded" />}>
        <Skeleton className="h-3.5 w-56 max-w-full rounded" />
      </DetailRow>
      <DetailRow label={<Skeleton className="h-3 w-16 rounded" />}>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-72 max-w-full rounded" />
        </div>
      </DetailRow>
    </div>
  );
});

OrganizationCardSkeleton.displayName = "OrganizationCardSkeleton";

export default OrganizationCardSkeleton;
