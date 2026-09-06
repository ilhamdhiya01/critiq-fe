import React from "react";

interface StepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const StepCard = React.memo(
  ({ title, description, children, footer }: StepCardProps) => {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface px-5.5 py-6 font-sans">
        <div>
          <h1 className="text-sm leading-[1.20] font-semibold tracking-[-.015em] text-neutral-100">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs leading-[1.20] text-text-secondary">
              {description}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-2 border-t border-border-row pt-4">{footer}</div>
        )}
      </div>
    );
  },
);

StepCard.displayName = "StepCard";

export default StepCard;
