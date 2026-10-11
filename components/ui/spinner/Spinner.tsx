import React, { forwardRef } from "react";

import Icon, { type IconProps } from "@/components/ui/icon/Icon";

interface SpinnerProps extends Omit<IconProps, "icon"> {
  size?: number;
}

// Loading indicator. Colour defaults to the brand accent; pass `className`
// with a text-* class to change it.
const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = 14, className = "text-primary-300", ...props }, ref) => (
    <Icon
      ref={ref}
      icon="TbLoader2"
      size={size}
      role={props["aria-label"] ? "img" : undefined}
      aria-hidden={props["aria-label"] ? undefined : true}
      className={`animate-spin ${className}`}
      {...props}
    />
  ),
);

Spinner.displayName = "Spinner";

export default Spinner;
