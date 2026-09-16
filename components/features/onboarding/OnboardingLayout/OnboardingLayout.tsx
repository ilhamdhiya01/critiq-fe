import React from "react";

interface OnboardingLayoutProps {
  children?: React.ReactNode;
}

const OnboardingLayout = React.memo(({ children }: OnboardingLayoutProps) => {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
});

OnboardingLayout.displayName = "OnboardingLayout";

export default OnboardingLayout;
