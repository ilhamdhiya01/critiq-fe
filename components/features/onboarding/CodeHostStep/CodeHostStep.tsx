"use client";

import React, { useCallback } from "react";

import RadioCard from "@/components/ui/radio-card";

import StepCard from "../StepCard";

export type CodeHost = "github" | "gitlab";

interface CodeHostStepProps {
  host: CodeHost | null;
  onHostChange: (host: CodeHost) => void;
  footer?: React.ReactNode;
}

const CodeHostStep = React.memo(
  ({ host, onHostChange, footer }: CodeHostStepProps) => {
    const handleSelectGithub = useCallback(
      () => onHostChange("github"),
      [onHostChange],
    );
    const handleSelectGitlab = useCallback(
      () => onHostChange("gitlab"),
      [onHostChange],
    );

    return (
      <StepCard
        title="Where does your code live?"
        description="Critiq scans pull request diffs only — never the full codebase."
        footer={footer}
      >
        <div className="flex gap-3">
          <RadioCard selected={host === "github"} onSelect={handleSelectGithub}>
            <span className="text-[13px] font-semibold text-neutral-100">
              GitHub
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-text-secondary">
              github.com
            </span>
          </RadioCard>
          <RadioCard selected={host === "gitlab"} onSelect={handleSelectGitlab}>
            <span className="text-[13px] font-semibold text-neutral-100">
              GitLab
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-text-secondary">
              self-hosted
            </span>
          </RadioCard>
        </div>
      </StepCard>
    );
  },
);

CodeHostStep.displayName = "CodeHostStep";

export default CodeHostStep;
