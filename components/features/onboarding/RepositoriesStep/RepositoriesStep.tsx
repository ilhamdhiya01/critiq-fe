"use client";

import React, { useCallback, useState } from "react";

import RepoPicker from "@/components/shared/repo-picker";
import { useDisconnectGitlab } from "@/lib/hooks/integrations/useDisconnectGitlab";
import { useIntegrationCandidates } from "@/lib/hooks/integrations/useIntegrationCandidates";
import { Provider } from "@/lib/types/auth.types";

import StepCard from "../StepCard";
import GitHubConnectGate from "./GitHubConnectGate";
import GitLabTokenGate from "./GitLabTokenGate";

const hostOf = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "") || "gitlab.com";

interface RepositoriesStepProps {
  selectedRepos: Record<string, boolean>;
  onToggleRepo: (id: string) => void;
  selectedBranches: Record<string, Record<string, boolean>>;
  onToggleBranch: (repoId: string, branch: string) => void;
  onBranchesReady: (repoId: string, defaultBranch: string) => void;
  onContinueBlockedChange: (blocked: boolean) => void;
  footer?: React.ReactNode;
  organizationId: string;
  provider: Provider;
}

const RepositoriesStep = React.memo(
  ({
    selectedRepos,
    onToggleRepo,
    selectedBranches,
    onToggleBranch,
    onBranchesReady,
    onContinueBlockedChange,
    footer,
    organizationId,
    provider,
  }: RepositoriesStepProps) => {
    const source = provider === "GITHUB" ? "github" : "gitlab";

    const [verifiedInstanceUrl, setVerifiedInstanceUrl] = useState("");

    const handleGitLabVerified = useCallback((instanceUrl: string) => {
      setVerifiedInstanceUrl(instanceUrl);
    }, []);

    const { handleDisconnectGitlab } = useDisconnectGitlab(organizationId);

    const handleChangeGitLabToken = useCallback(async () => {
      try {
        await handleDisconnectGitlab();
      } catch {
        // error sudah ditampilkan via toast oleh useDisconnectGitlab
      }
    }, [handleDisconnectGitlab]);

    const {
      data: candidates,
      isNotConnected,
      isFetching,
    } = useIntegrationCandidates(organizationId, source, !!organizationId);

    const selectedCount = Object.values(selectedRepos).filter(Boolean).length;

    const totalBranchesSelected = Object.values(selectedBranches).reduce(
      (sum, repoBranches) =>
        sum + Object.values(repoBranches).filter(Boolean).length,
      0,
    );

    const description =
      isNotConnected && provider === "GITHUB"
        ? "Install the GitHub App first — the repository list loads from it."
        : `${selectedCount} repo(s), ${totalBranchesSelected} branch(es) selected. A webhook is installed per repo — every PR push triggers a diff scan.`;

    return (
      <StepCard
        title="Choose repositories to monitor"
        description={description}
        footer={footer}
      >
        <div className="flex flex-col gap-3">
          {isNotConnected && provider === "GITHUB" && (
            <GitHubConnectGate orgId={organizationId} />
          )}

          {!isNotConnected && provider === "GITLAB" && (
            <div className="flex items-center gap-3 rounded-lg border border-border-subtle px-3.5 py-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-mono text-[12.5px] text-neutral-100">
                  {hostOf(verifiedInstanceUrl)}
                </span>
                <span className="text-[11px] leading-normal text-text-secondary">
                  Projects reachable by the access token (Maintainer or above).
                </span>
              </div>
              <button
                type="button"
                onClick={handleChangeGitLabToken}
                className="text-[12px] text-text-secondary hover:underline"
              >
                Change
              </button>
              <span className="rounded-full border border-vendor-gitlab/50 px-2.5 py-0.5 font-mono text-[10px] tracking-[.06em] text-vendor-gitlab uppercase">
                GitLab · Token
              </span>
            </div>
          )}

          {isNotConnected && provider === "GITLAB" && (
            <GitLabTokenGate
              onVerified={handleGitLabVerified}
              orgId={organizationId}
            />
          )}

          {!isNotConnected && (
            <RepoPicker
              organizationId={organizationId}
              source={source}
              candidates={candidates}
              isLoading={isFetching}
              selectedRepos={selectedRepos}
              selectedBranches={selectedBranches}
              onToggleRepo={onToggleRepo}
              onToggleBranch={onToggleBranch}
              onBranchesReady={onBranchesReady}
              onBlockedChange={onContinueBlockedChange}
              emptyState="No projects reachable by this token."
            />
          )}
        </div>
      </StepCard>
    );
  },
);

RepositoriesStep.displayName = "RepositoriesStep";

export default RepositoriesStep;
