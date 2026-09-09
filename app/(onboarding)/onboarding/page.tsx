import { Suspense } from "react";

import { Onboarding } from "@/components/features/onboarding";
import { getUserFromToken } from "@/lib/helpers";

const OnboardingPage = async () => {
  const decodedToken = await getUserFromToken();
  return (
    <Onboarding.OnboardingLayout>
      <Suspense fallback={null}>
        <Onboarding.OnboardingWizard decodedToken={decodedToken} />
      </Suspense>
    </Onboarding.OnboardingLayout>
  );
};

export default OnboardingPage;
