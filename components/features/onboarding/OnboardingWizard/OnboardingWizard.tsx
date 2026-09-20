"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { useConnectRepositories } from "@/lib/hooks/integrations/useConnectRepositories";
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
    const [selectedBranches, setSelectedBranches] = useState<
      Record<string, Record<string, boolean>>
    >({});
    const [branchContinueBlocked, setBranchContinueBlocked] = useState(false);
    const [branchPolicy, setBranchPolicy] = useState<BranchPolicy>("allow_ai");
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
    const { handleConnectRepositories, isConnectingRepos } =
      useConnectRepositories(
        organisationId ?? queryOrgId ?? decodedToken?.activeOrgId ?? "",
      );

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
      hydrateOrganisationId(queryOrgId || decodedToken!.activeOrgId!);
    }

    const handleBack = useCallback(() => {
      setStep((prev) => PREVIOUS_STEP[prev]);
    }, []);

    const handleSkip = useCallback(() => {
      router.replace("/dashboard");
    }, [router]);

    const processConnectRepositories = useCallback(async () => {
      if (!decodedToken?.provider) return;
      const source: "github" | "gitlab" =
        decodedToken.provider === "GITHUB" ? "github" : "gitlab";

      const projects = Object.entries(selectedRepos)
        .filter(([, isSelected]) => isSelected)
        .map(([id]) => ({
          id,
          monitoredBranches: Object.entries(selectedBranches[id] ?? {})
            .filter(([, picked]) => picked)
            .map(([branch]) => branch),
        }));

      const payload = {
        source,
        projects,
        defaultPolicy: branchPolicy,
      };
      await handleConnectRepositories(payload);
    }, [
      branchPolicy,
      decodedToken?.provider,
      handleConnectRepositories,
      selectedBranches,
      selectedRepos,
    ]);

    const handleContinue = useCallback(async () => {
      if (step === TOTAL_STEPS) {
        await processConnectRepositories();
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
    }, [step, needsSave, processConnectRepositories, handleCreateOrganization]);

    const handleToggleRepo = useCallback((id: string) => {
      setSelectedRepos((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (!next[id]) {
          setSelectedBranches((prevBranches) => {
            if (!(id in prevBranches)) return prevBranches;
            const rest = { ...prevBranches };
            delete rest[id];
            return rest;
          });
        }
        return next;
      });
    }, []);

    const handleToggleBranch = useCallback((repoId: string, branch: string) => {
      setSelectedBranches((prev) => ({
        ...prev,
        [repoId]: { ...prev[repoId], [branch]: !prev[repoId]?.[branch] },
      }));
    }, []);

    const handleBranchesReady = useCallback(
      (repoId: string, defaultBranch: string) => {
        setSelectedBranches((prev) =>
          prev[repoId]
            ? prev
            : { ...prev, [repoId]: { [defaultBranch]: true } },
        );
      },
      [],
    );

    const handleContinueBlockedChange = useCallback((blocked: boolean) => {
      setBranchContinueBlocked(blocked);
    }, []);

    const handleSelectBranchPolicy = useCallback((value: BranchPolicy) => {
      setBranchPolicy(value);
    }, []);

    const selectedRepoCount =
      Object.values(selectedRepos).filter(Boolean).length;

    const canContinue =
      (step === ONBOARDING_STEP.ORGANIZATION &&
        organisationName.trim().length > 0) ||
      (step === ONBOARDING_STEP.REPOSITORIES &&
        selectedRepoCount > 0 &&
        !branchContinueBlocked) ||
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
          isLoading={isCreating || isConnectingRepos}
        />
      ),
      [
        step,
        canContinue,
        handleBack,
        handleSkip,
        handleContinue,
        isCreating,
        isConnectingRepos,
      ],
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
            selectedBranches={selectedBranches}
            onToggleBranch={handleToggleBranch}
            onBranchesReady={handleBranchesReady}
            onContinueBlockedChange={handleContinueBlockedChange}
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
            onBranchPolicyChange={handleSelectBranchPolicy}
            footer={footer}
          />
        )}
      </div>
    );
  },
);

OnboardingWizard.displayName = "OnboardingWizard";

export default OnboardingWizard;
