import classNames from "classnames";
import React from "react";

import Skeleton from "@/components/ui/skeleton";

const SKELETON_ROWS = ["w-72", "w-56", "w-80", "w-40", "w-52"];

const AiProviderCardSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-4">
      {SKELETON_ROWS.map((width, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-3 w-28 flex-none rounded" />
          <Skeleton
            className={classNames("h-8 max-w-full rounded-md", width)}
          />
        </div>
      ))}
      <div className="flex justify-end gap-2.5 border-t border-border-row pt-3.5">
        <Skeleton className="h-8 w-32 rounded-[7px]" />
        <Skeleton className="h-8 w-20 rounded-[7px]" />
      </div>
    </div>
  );
});

AiProviderCardSkeleton.displayName = "AiProviderCardSkeleton";

export default AiProviderCardSkeleton;
