import { default as BranchPolicyStep } from "./BranchPolicyStep";
import { default as OnboardingLayout } from "./OnboardingLayout";
import { default as OnboardingWizard } from "./OnboardingWizard";
import { default as OrganizationStep } from "./OrganizationStep";
import { default as RepositoriesStep } from "./RepositoriesStep";
import { default as StepCard } from "./StepCard";
import { default as StepFooter } from "./StepFooter";
import { default as StepHeader } from "./StepHeader";

export const Onboarding = {
  OnboardingLayout,
  OnboardingWizard,
  StepHeader,
  StepFooter,
  StepCard,
  OrganizationStep,
  RepositoriesStep,
  BranchPolicyStep,
} as const;
