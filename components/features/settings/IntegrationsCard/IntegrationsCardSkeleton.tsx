import React from "react";

const SKELETON_ROWS = 2;

const IntegrationsCardSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-border-row py-3 last:border-b-0"
        >
          <div className="flex flex-col gap-2">
            <div className="animate-shimmer h-3.5 w-16 rounded" />
            <div className="animate-shimmer h-3 w-56 rounded" />
          </div>
          <div className="animate-shimmer h-7 w-28 rounded-[7px]" />
        </div>
      ))}
    </div>
  );
});

IntegrationsCardSkeleton.displayName = "IntegrationsCardSkeleton";

export default IntegrationsCardSkeleton;
