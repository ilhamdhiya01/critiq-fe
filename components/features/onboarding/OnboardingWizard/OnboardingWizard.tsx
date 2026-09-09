"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { useCreateOrganization } from "@/lib/hooks/integrations/useCreateOrganization";
import type { DecodedToken } from "@/lib/types/auth.types";

import type { BranchPolicy } from "../BranchPolicyStep";
import BranchPolicyStep from "../BranchPolicyStep";
import OrganizationStep from "../OrganizationStep";
import RepositoriesStep from "../RepositoriesStep";
import StepFooter from "../StepFooter";
import StepHeader from "../StepHeader";

const ONBOARDING_STEP = {
  ORGANIZATION: 1,
  REPOSITORIES: 2,
  BRANCH_POLICY: 3,
} as const;

type OnboardingStep = (typeof ONBOARDING_STEP)[keyof typeof ONBOARDING_STEP];

const TOTAL_STEPS = ONBOARDING_STEP.BRANCH_POLICY;

const PREVIOUS_STEP: Record<OnboardingStep, OnboardingStep> = {
  [ONBOARDING_STEP.ORGANIZATION]: ONBOARDING_STEP.ORGANIZATION,
  [ONBOARDING_STEP.REPOSITORIES]: ONBOARDING_STEP.ORGANIZATION,
  [ONBOARDING_STEP.BRANCH_POLICY]: ONBOARDING_STEP.REPOSITORIES,
};

const NEXT_STEP: Record<OnboardingStep, OnboardingStep> = {
  [ONBOARDING_STEP.ORGANIZATION]: ONBOARDING_STEP.REPOSITORIES,
  [ONBOARDING_STEP.REPOSITORIES]: ONBOARDING_STEP.BRANCH_POLICY,
  [ONBOARDING_STEP.BRANCH_POLICY]: ONBOARDING_STEP.BRANCH_POLICY,
};

interface OnboardingWizardProps {
  decodedToken: DecodedToken | null;
}

const OnboardingWizard = React.memo(
  ({ decodedToken }: OnboardingWizardProps) => {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>(
      ONBOARDING_STEP.ORGANIZATION,
    );

    const [selectedRepos, setSelectedRepos] = useState<Record<string, boolean>>(
      {},
    );
    const [branchPolicy, setBranchPolicy] = useState<BranchPolicy | null>(null);

    const {
      handleCreateOrganization,
      organisationId,
      organisationName,
      needsSave,
      setOrganisationName,
      hydrateOrganisationId,
    } = useCreateOrganization();

    // Reload di tengah wizard membuat Zustand store kosong lagi (tanpa persist).
    // Kalau backend sudah pernah membuat org untuk user ini (ada di token),
    // suntikkan id itu sekali di render body supaya continue berikutnya
    // memakai jalur update, bukan create org duplikat.
    const hasHydratedOrgId = useRef(false);
    if (
      !hasHydratedOrgId.current &&
      !organisationId &&
      decodedToken?.activeOrgId
    ) {
      hasHydratedOrgId.current = true;
      hydrateOrganisationId(decodedToken.activeOrgId);
    }

    const handleBack = useCallback(() => {
      setStep((prev) => PREVIOUS_STEP[prev]);
    }, []);

    const handleSkip = useCallback(() => {
      router.replace("/dashboard");
    }, [router]);

    const handleContinue = useCallback(async () => {
      if (step === TOTAL_STEPS) {
        router.replace("/dashboard");
        return;
      }
      if (step === ONBOARDING_STEP.ORGANIZATION && needsSave) {
        await handleCreateOrganization();
      }
      setStep(NEXT_STEP[step]);
    }, [step, router, needsSave, handleCreateOrganization]);

    const handleToggleRepo = useCallback((id: string) => {
      setSelectedRepos((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const selectedRepoCount =
      Object.values(selectedRepos).filter(Boolean).length;

    const canContinue =
      (step === ONBOARDING_STEP.ORGANIZATION &&
        organisationName.trim().length > 0) ||
      (step === ONBOARDING_STEP.REPOSITORIES && selectedRepoCount > 0) ||
      (step === ONBOARDING_STEP.BRANCH_POLICY && branchPolicy !== null);

    const footer = useMemo(
      () => (
        <StepFooter
          canBack={step > ONBOARDING_STEP.ORGANIZATION}
          canContinue={canContinue}
          isLastStep={step === TOTAL_STEPS}
          onBack={handleBack}
          onSkip={handleSkip}
          onContinue={handleContinue}
        />
      ),
      [step, canContinue, handleBack, handleSkip, handleContinue],
    );

    return (
      <div className="flex flex-col gap-8">
        <StepHeader currentStep={step} />

        {step === ONBOARDING_STEP.ORGANIZATION && (
          <OrganizationStep
            orgName={organisationName}
            onOrgNameChange={setOrganisationName}
            footer={footer}
          />
        )}
        {step === ONBOARDING_STEP.REPOSITORIES && (
          <RepositoriesStep
            source="gitlab"
            selectedRepos={selectedRepos}
            onToggleRepo={handleToggleRepo}
            footer={footer}
          />
        )}
        {step === ONBOARDING_STEP.BRANCH_POLICY && (
          <BranchPolicyStep
            branchPolicy={branchPolicy}
            onBranchPolicyChange={setBranchPolicy}
            footer={footer}
          />
        )}
      </div>
    );
  },
);

OnboardingWizard.displayName = "OnboardingWizard";

export default OnboardingWizard;
