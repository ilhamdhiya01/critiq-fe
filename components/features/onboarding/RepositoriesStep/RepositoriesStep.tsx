"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import { useIntegrationCandidates } from "@/lib/hooks/integrations/useIntegrationCandidates";
import type {
  IntegrationSource,
  RepoCandidate,
} from "@/lib/types/integration.types";

import StepCard from "../StepCard";
import GitLabTokenGate from "./GitLabTokenGate";

// TODO: gantikan dengan orgId nyata setelah Organization step (POST /orgs) tersambung.
const PENDING_ORG_ID = "pending-org";

interface RepoRowProps {
  repo: RepoCandidate;
  checked: boolean;
  onToggle: (id: number) => void;
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
        {repo.path}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
        {repo.lang}
      </span>
    </div>
  );
});

RepoRow.displayName = "RepoRow";

interface RepositoriesStepProps {
  // TODO: isi dari provider login sesungguhnya begitu step 0/1 (auth provider detection) tersambung.
  source?: IntegrationSource;
  selectedRepos: Record<string, boolean>;
  onToggleRepo: (id: string) => void;
  footer?: React.ReactNode;
}

const RepositoriesStep = React.memo(
  ({
    source = "gitlab",
    selectedRepos,
    onToggleRepo,
    footer,
  }: RepositoriesStepProps) => {
    const [isGitLabVerified, setIsGitLabVerified] = useState(false);

    const handleGitLabVerified = useCallback(() => {
      setIsGitLabVerified(true);
    }, []);

    const handleChangeGitLabToken = useCallback(() => {
      setIsGitLabVerified(false);
    }, []);

    const showGate = source === "gitlab" && !isGitLabVerified;

    const { data: candidates, isLoading } = useIntegrationCandidates(
      PENDING_ORG_ID,
      source,
      !showGate,
    );

    const handleToggle = useCallback(
      (id: number) => onToggleRepo(String(id)),
      [onToggleRepo],
    );

    const selectedCount = Object.values(selectedRepos).filter(Boolean).length;

    return (
      <StepCard
        title="Choose repositories to monitor"
        description={`A webhook is installed per repo — every PR push triggers a diff scan. ${selectedCount} selected.`}
        footer={footer}
      >
        <div className="flex flex-col gap-3">
          {source === "gitlab" && isGitLabVerified && (
            <div className="flex items-center gap-2 rounded-lg border border-border-subtle px-3.5 py-2 text-[12px] text-text-secondary">
              <span className="font-mono text-[10.5px] tracking-[.06em] text-vendor-gitlab uppercase">
                GitLab
              </span>
              <span>· TOKEN</span>
              <button
                type="button"
                onClick={handleChangeGitLabToken}
                className="ml-auto text-primary-300 hover:underline"
              >
                Change
              </button>
            </div>
          )}

          {showGate && <GitLabTokenGate onVerified={handleGitLabVerified} />}

          {!showGate && isLoading && (
            <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
              Fetching projects…
            </div>
          )}

          {!showGate && !isLoading && candidates?.length === 0 && (
            <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
              No projects reachable by this token.
            </div>
          )}

          {!showGate && !isLoading && candidates && candidates.length > 0 && (
            <div className="max-h-62.5 overflow-auto rounded-lg border border-border-subtle">
              {candidates.map((repo) => (
                <RepoRow
                  key={repo.id}
                  repo={repo}
                  checked={!!selectedRepos[String(repo.id)]}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      </StepCard>
    );
  },
);

RepositoriesStep.displayName = "RepositoriesStep";

export default RepositoriesStep;
