"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import type { BranchPolicy } from "../BranchPolicyStep";
import BranchPolicyStep from "../BranchPolicyStep";
import type { CodeHost } from "../CodeHostStep";
import CodeHostStep from "../CodeHostStep";
import OrganizationStep from "../OrganizationStep";
import RepositoriesStep from "../RepositoriesStep";
import StepFooter from "../StepFooter";
import StepHeader from "../StepHeader";

const TOTAL_STEPS = 4;

const parseStep = (raw: string | null): number => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > TOTAL_STEPS) {
    return 1;
  }
  return parsed;
};

const OnboardingWizard = React.memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const step = parseStep(searchParams.get("step"));

  const [host, setHost] = useState<CodeHost | null>(null);
  const [orgName, setOrgName] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<Record<string, boolean>>(
    {},
  );
  const [branchPolicy, setBranchPolicy] = useState<BranchPolicy | null>(null);

  const goToStep = useCallback(
    (next: number) => {
      router.replace(`${pathname}?step=${next}`);
    },
    [pathname, router],
  );

  const handleBack = useCallback(() => {
    goToStep(Math.max(1, step - 1));
  }, [goToStep, step]);

  const handleSkip = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const handleContinue = useCallback(() => {
    if (step === TOTAL_STEPS) {
      router.replace("/dashboard");
      return;
    }
    goToStep(step + 1);
  }, [goToStep, router, step]);

  const handleToggleRepo = useCallback((id: string) => {
    setSelectedRepos((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectedRepoCount = Object.values(selectedRepos).filter(Boolean).length;

  const canContinue =
    (step === 1 && host !== null) ||
    (step === 2 && orgName.trim().length > 0) ||
    (step === 3 && selectedRepoCount > 0) ||
    (step === 4 && branchPolicy !== null);

  const footer = useMemo(
    () => (
      <StepFooter
        canBack={step > 1}
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

      {step === 1 && (
        <CodeHostStep host={host} onHostChange={setHost} footer={footer} />
      )}
      {step === 2 && (
        <OrganizationStep
          orgName={orgName}
          onOrgNameChange={setOrgName}
          footer={footer}
        />
      )}
      {step === 3 && (
        <RepositoriesStep
          selectedRepos={selectedRepos}
          onToggleRepo={handleToggleRepo}
          footer={footer}
        />
      )}
      {step === 4 && (
        <BranchPolicyStep
          branchPolicy={branchPolicy}
          onBranchPolicyChange={setBranchPolicy}
          footer={footer}
        />
      )}
    </div>
  );
});

OnboardingWizard.displayName = "OnboardingWizard";

export default OnboardingWizard;
