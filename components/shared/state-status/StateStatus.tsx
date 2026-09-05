import React from "react";

interface StateStatusProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const StateStatus = React.memo(
  ({ title, description, action }: StateStatusProps) => {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border-default bg-surface px-6 py-16 text-center">
        <p className="text-sm font-semibold text-neutral-100">{title}</p>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
        {action}
      </div>
    );
  },
);

StateStatus.displayName = "StateStatus";

export default StateStatus;
