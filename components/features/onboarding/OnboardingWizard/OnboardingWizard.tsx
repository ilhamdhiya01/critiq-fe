"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { useCreateOrganization } from "@/lib/hooks/integrations/useCreateOrganization";
import { useMembershipWithOrg } from "@/lib/hooks/integrations/useMembershipWithOrg";
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

const STEP_BY_QUERY_VALUE: Record<string, OnboardingStep> = {
  "1": ONBOARDING_STEP.ORGANIZATION,
  "2": ONBOARDING_STEP.REPOSITORIES,
  "3": ONBOARDING_STEP.BRANCH_POLICY,
};

interface OnboardingWizardProps {
  decodedToken: DecodedToken | null;
}

const OnboardingWizard = React.memo(
  ({ decodedToken }: OnboardingWizardProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryOrgId = searchParams.get("orgId");
    const queryStep = searchParams.get("step");

    const [step, setStep] = useState<OnboardingStep>(
      () =>
        (queryStep && STEP_BY_QUERY_VALUE[queryStep]) ||
        ONBOARDING_STEP.ORGANIZATION,
    );

    const [selectedRepos, setSelectedRepos] = useState<Record<string, boolean>>(
      {},
    );
    const [branchPolicy, setBranchPolicy] = useState<BranchPolicy | null>(null);
    useMembershipWithOrg(decodedToken?.activeOrgId as string);

    const {
      handleCreateOrganization,
      organisationId,
      organisationName,
      needsSave,
      isCreating,
      setOrganisationName,
      hydrateOrganisationId,
    } = useCreateOrganization();

    // Reload di tengah wizard, atau redirect balik dari GitHub App install,
    // membuat Zustand store kosong lagi (tanpa persist). `orgId` di query
    // string (dari redirect GitHub) paling fresh, baru fallback ke token
    // (org yang sudah pernah dibuat sebelumnya) — suntikkan sekali di render
    // body supaya continue berikutnya memakai jalur update, bukan create
    // org duplikat.
    const hasHydratedOrgId = useRef(false);
    if (
      !hasHydratedOrgId.current &&
      !organisationId &&
      (queryOrgId || decodedToken?.activeOrgId)
    ) {
      hasHydratedOrgId.current = true;
      hydrateOrganisationId(queryOrgId ?? decodedToken!.activeOrgId);
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
        try {
          await handleCreateOrganization();
        } catch {
          return;
        }
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
          isLoading={isCreating}
        />
      ),
      [step, canContinue, handleBack, handleSkip, handleContinue, isCreating],
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
            selectedRepos={selectedRepos}
            onToggleRepo={handleToggleRepo}
            footer={footer}
            organizationId={
              organisationId ?? queryOrgId ?? decodedToken?.activeOrgId ?? ""
            }
            provider={decodedToken?.provider || "GITLAB"}
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
