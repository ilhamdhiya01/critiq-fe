import { Suspense } from "react";

import { Onboarding } from "@/components/features/onboarding";
import { getUserFromToken } from "@/lib/helpers";

// Same wizard as /setup, starting from an empty org; open to any signed-in
// user whatever orgs they already have.
const NewOrganizationPage = async () => {
  const decodedToken = await getUserFromToken();
  return (
    <Onboarding.OnboardingLayout>
      <Suspense fallback={null}>
        <Onboarding.OnboardingWizard decodedToken={decodedToken} mode="new" />
      </Suspense>
    </Onboarding.OnboardingLayout>
  );
};

export default NewOrganizationPage;
