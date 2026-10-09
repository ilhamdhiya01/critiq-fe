import React, { forwardRef } from "react";

import Icon from "@/components/ui/icon/Icon";

interface FieldErrorProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "danger" | "warning";
  // Shows the warning icon before the message (default true).
  withIcon?: boolean;
}

// Small inline error under a field or row.
const FieldError = forwardRef<HTMLSpanElement, FieldErrorProps>(
  (
    { tone = "danger", withIcon = true, className, children, ...props },
    ref,
  ) => (
    <span
      ref={ref}
      className={[
        "flex items-center gap-1.5 text-[11px]",
        tone === "danger" ? "text-danger-light" : "text-warning-light",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {withIcon && (
        <Icon icon="TbAlertTriangle" size={12} className="flex-none" />
      )}
      {children}
    </span>
  ),
);

FieldError.displayName = "FieldError";

export default FieldError;
