import React from "react";

interface OnboardingLayoutProps {
  children?: React.ReactNode;
}

const OnboardingLayout = React.memo(({ children }: OnboardingLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="m-auto w-full max-w-xl">{children}</div>
    </div>
  );
});

OnboardingLayout.displayName = "OnboardingLayout";

export default OnboardingLayout;
