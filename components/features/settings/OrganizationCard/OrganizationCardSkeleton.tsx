import React from "react";

const OrganizationCardSkeleton = React.memo(() => {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-y-3">
      <div className="animate-shimmer h-3 w-12 rounded" />
      <div className="flex items-center gap-2.5">
        <div className="animate-shimmer h-6 w-6 rounded-md" />
        <div className="animate-shimmer h-3.5 w-40 rounded" />
      </div>

      <div className="animate-shimmer h-3 w-10 rounded" />
      <div className="animate-shimmer h-3.5 w-56 rounded" />

      <div className="animate-shimmer h-3 w-16 rounded" />
      <div className="flex items-center gap-2.5">
        <div className="animate-shimmer h-5 w-16 rounded-full" />
        <div className="animate-shimmer h-3 w-72 max-w-full rounded" />
      </div>
    </div>
  );
});

OrganizationCardSkeleton.displayName = "OrganizationCardSkeleton";

export default OrganizationCardSkeleton;
