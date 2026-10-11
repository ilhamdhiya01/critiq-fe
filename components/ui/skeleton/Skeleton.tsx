import React, { forwardRef } from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

// Shimmer placeholder; size and shape come from `className`.
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={className ? `animate-shimmer ${className}` : "animate-shimmer"}
      {...props}
    />
  ),
);

Skeleton.displayName = "Skeleton";

export default Skeleton;
