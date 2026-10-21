"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";

import GitHubReturnNotice from "@/components/shared/github-return-notice";
import { DEFAULT_BRANCH_POLICY } from "@/const/repository.constant";
import { readLastOrgSlug } from "@/lib/helpers/last-org.helper";
import { pickExitMembership } from "@/lib/helpers/organization.helper";
import { useConnectRepositories } from "@/lib/hooks/integrations/useConnectRepositories";
import { useCreateOrganization } from "@/lib/hooks/integrations/useCreateOrganization";
import { useMembershipWithOrg } from "@/lib/hooks/integrations/useMembershipWithOrg";
import { useRepoSelection } from "@/lib/hooks/repositories/useRepoSelection";
import { usePendingInviteRedirect } from "@/lib/hooks/usePendingInviteRedirect";
import type { DecodedToken, Provider } from "@/lib/types/auth.types";
import type { BranchPolicy } from "@/lib/types/repository.types";
import { ROUTES } from "@/routes";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

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
  // "setup": first org, or resuming one (?step=2&orgId=…).
  // "new": another organization from scratch (/organizations/new).
  mode?: "setup" | "new";
}

const OnboardingWizard = React.memo(
  ({ decodedToken, mode = "setup" }: OnboardingWizardProps) => {
    const router = useRouter();
    const isNew = mode === "new";

    // A new org starts empty: never prefill the active org, or step 1 would
    // rename it instead of creating one. Done once, during the first render,
    // so nothing stale shows.
    const hasReset = useRef(false);
    if (isNew && !hasReset.current) {
      hasReset.current = true;
      useOnboardingStore.getState().reset();
    }

    // Signed in from an invite link: accept it before creating a new org.
    const isGoingToInvite = usePendingInviteRedirect();
    const searchParams = useSearchParams();
    const queryOrgId = searchParams.get("orgId");
    const queryStep = searchParams.get("step");

    const [step, setStep] = useState<OnboardingStep>(
      () =>
        (queryStep && STEP_BY_QUERY_VALUE[queryStep]) ||
        ONBOARDING_STEP.ORGANIZATION,
    );

    const {
      selectedRepos,
      selectedBranches,
      selectedCount: selectedRepoCount,
      toggleRepo: handleToggleRepo,
      toggleBranch: handleToggleBranch,
      markBranchesReady: handleBranchesReady,
      toProjects,
    } = useRepoSelection();
    const [branchContinueBlocked, setBranchContinueBlocked] = useState(false);
    const [branchPolicy, setBranchPolicy] = useState<BranchPolicy>(
      DEFAULT_BRANCH_POLICY,
    );
    // "Use GitLab instead" while a GitHub install waits for the org owner.
    const [providerOverride, setProviderOverride] = useState<Provider | null>(
      null,
    );
    const provider = providerOverride ?? decodedToken?.provider;

    const {
      handleCreateOrganization,
      organisationId,
      organisationSlug,
      organisationName,
      needsSave,
      isCreating,
      setOrganisationName,
      hydrateOrganisationId,
    } = useCreateOrganization();

    // The org this run sets up: the one created here (new), else the one in
    // the URL or the session (setup).
    const targetOrgId = isNew
      ? (organisationId ?? "")
      : (organisationId ?? queryOrgId ?? decodedToken?.activeOrgId ?? "");

    // Setup mode fills name/slug from that org; a new org fills them from the
    // create response instead.
    const { orgSlug, organizations } = useMembershipWithOrg(
      isNew ? undefined : targetOrgId || undefined,
    );

    const { handleConnectRepositories, isConnectingRepos } =
      useConnectRepositories(targetOrgId, {
        redirectSlug: organisationSlug || orgSlug,
      });

    // Where Cancel / Skip go. Setup skips into the org being set up once it
    // exists (its pages show the setup banner); a new org cancels back to
    // another org. Hidden when there is nowhere to go.
    const ownSlug = organisationSlug || orgSlug;
    const otherOrgSlug = useMemo(
      () =>
        organizations
          ? pickExitMembership(organizations, readLastOrgSlug(), targetOrgId)
              ?.organization.slug
          : undefined,
      [organizations, targetOrgId],
    );
    const exitSlug = (!isNew && ownSlug) || otherOrgSlug;

    // Reload di tengah wizard, atau redirect balik dari GitHub App install,
    // membuat Zustand store kosong lagi (tanpa persist). `orgId` di query
    // string (dari redirect GitHub) paling fresh, baru fallback ke token
    // (org yang sudah pernah dibuat sebelumnya) — suntikkan sekali di render
    // body supaya continue berikutnya memakai jalur update, bukan create
    // org duplikat.
    const hasHydratedOrgId = useRef(false);
    if (
      !isNew &&
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

    const handleExit = useCallback(() => {
      if (exitSlug) router.replace(ROUTES.dashboard(exitSlug));
    }, [exitSlug, router]);

    const processConnectRepositories = useCallback(async () => {
      if (!provider) return;
      const source: "github" | "gitlab" =
        provider === "GITHUB" ? "github" : "gitlab";

      const payload = {
        source,
        projects: toProjects(),
        defaultPolicy: branchPolicy,
      };
      await handleConnectRepositories(payload);
    }, [branchPolicy, provider, handleConnectRepositories, toProjects]);

    const handleUseGitLab = useCallback(
      () => setProviderOverride("GITLAB"),
      [],
    );

    // Step 2 runs after the org exists: skipping opens it (its pages show the
    // setup banner) rather than leaving for another org.
    const handleSkipForNow = useCallback(() => {
      if (ownSlug) router.replace(ROUTES.dashboard(ownSlug));
      else handleExit();
    }, [ownSlug, router, handleExit]);

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

    const handleContinueBlockedChange = useCallback((blocked: boolean) => {
      setBranchContinueBlocked(blocked);
    }, []);

    const handleSelectBranchPolicy = useCallback((value: BranchPolicy) => {
      setBranchPolicy(value);
    }, []);

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
          exitLabel={isNew ? "Cancel" : "Skip setup"}
          onExit={exitSlug ? handleExit : undefined}
          onContinue={handleContinue}
          isLoading={isCreating || isConnectingRepos}
        />
      ),
      [
        step,
        canContinue,
        handleBack,
        isNew,
        exitSlug,
        handleExit,
        handleContinue,
        isCreating,
        isConnectingRepos,
      ],
    );

    if (isGoingToInvite) return null;

    return (
      <div className="flex flex-col gap-8">
        <GitHubReturnNotice />
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
            organizationId={targetOrgId}
            provider={provider || "GITLAB"}
            onUseGitLab={handleUseGitLab}
            onSkip={handleSkipForNow}
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
