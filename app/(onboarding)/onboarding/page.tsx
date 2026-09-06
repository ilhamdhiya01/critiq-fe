import { Suspense } from "react";

import { Onboarding } from "@/components/features/onboarding";

const OnboardingPage = () => {
  return (
    <Onboarding.OnboardingLayout>
      <Suspense fallback={null}>
        <Onboarding.OnboardingWizard />
      </Suspense>
    </Onboarding.OnboardingLayout>
  );
};

export default OnboardingPage;
