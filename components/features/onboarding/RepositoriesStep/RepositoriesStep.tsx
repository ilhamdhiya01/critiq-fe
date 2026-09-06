"use client";

import classNames from "classnames";
import React, { useCallback } from "react";

import Checkbox from "@/components/ui/checkbox";

import StepCard from "../StepCard";

interface RepoCandidate {
  id: string;
  name: string;
  language: string;
  languageColor: string;
}

const REPO_CANDIDATES: RepoCandidate[] = [
  {
    id: "critiq-core",
    name: "critiq-core",
    language: "TypeScript",
    languageColor: "bg-info",
  },
  {
    id: "payments-api",
    name: "payments-api",
    language: "Go",
    languageColor: "bg-success",
  },
  {
    id: "web-console",
    name: "web-console",
    language: "TypeScript",
    languageColor: "bg-info",
  },
  {
    id: "infra-terraform",
    name: "infra-terraform",
    language: "HCL",
    languageColor: "bg-primary-400",
  },
  {
    id: "mobile-sdk",
    name: "mobile-sdk",
    language: "Kotlin",
    languageColor: "bg-warning",
  },
];

interface RepoRowProps {
  repo: RepoCandidate;
  checked: boolean;
  onToggle: (id: string) => void;
}

const RepoRow = React.memo(({ repo, checked, onToggle }: RepoRowProps) => {
  return (
    <div
      onClick={() => onToggle(repo.id)}
      className={classNames(
        "flex cursor-pointer items-center gap-3 border-b border-border-row px-3.5 py-2.5 last:border-b-0",
        { "bg-primary-950": checked },
      )}
    >
      <Checkbox checked={checked} readOnly />
      <span className="flex-1 font-mono text-[12.5px] text-neutral-100">
        {repo.name}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span
          className={classNames("h-1.5 w-1.5 rounded-full", repo.languageColor)}
        />
        {repo.language}
      </span>
    </div>
  );
});

RepoRow.displayName = "RepoRow";

interface RepositoriesStepProps {
  selectedRepos: Record<string, boolean>;
  onToggleRepo: (id: string) => void;
  footer?: React.ReactNode;
}

const RepositoriesStep = React.memo(
  ({ selectedRepos, onToggleRepo, footer }: RepositoriesStepProps) => {
    const handleToggle = useCallback(
      (id: string) => onToggleRepo(id),
      [onToggleRepo],
    );

    const selectedCount = Object.values(selectedRepos).filter(Boolean).length;

    return (
      <StepCard
        title="Choose repositories to monitor"
        description={`A webhook is installed per repo — every PR push triggers a diff scan. ${selectedCount} selected.`}
        footer={footer}
      >
        <div className="max-h-62.5 overflow-auto rounded-lg border border-border-subtle">
          {REPO_CANDIDATES.map((repo) => (
            <RepoRow
              key={repo.id}
              repo={repo}
              checked={!!selectedRepos[repo.id]}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </StepCard>
    );
  },
);

RepositoriesStep.displayName = "RepositoriesStep";

export default RepositoriesStep;
