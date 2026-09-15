"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import { useDisconnectGitlab } from "@/lib/hooks/integrations/useDisconnectGitlab";
import { useIntegrationCandidates } from "@/lib/hooks/integrations/useIntegrationCandidates";
import { Provider } from "@/lib/types/auth.types";
import type { RepoCandidate } from "@/lib/types/integration.types";

import StepCard from "../StepCard";
import GitHubConnectGate from "./GitHubConnectGate";
import GitLabTokenGate from "./GitLabTokenGate";

const hostOf = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "") || "gitlab.com";

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
        <span className="h-1.5 w-1.5 rounded-full bg-info" />
        {repo.lang}
      </span>
      <span className="rounded-full border border-border-default px-2 py-0.5 font-mono text-[10px] text-text-secondary capitalize">
        {repo.visibility}
      </span>
    </div>
  );
});

RepoRow.displayName = "RepoRow";

interface RepositoriesStepProps {
  selectedRepos: Record<string, boolean>;
  onToggleRepo: (id: string) => void;
  footer?: React.ReactNode;
  organizationId: string;
  provider: Provider;
}

const RepositoriesStep = React.memo(
  ({
    selectedRepos,
    onToggleRepo,
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

    const handleToggle = useCallback(
      (id: number) => onToggleRepo(String(id)),
      [onToggleRepo],
    );

    const selectedCount = Object.values(selectedRepos).filter(Boolean).length;

    const description =
      isNotConnected && provider === "GITHUB"
        ? "Install the GitHub App first — the repository list loads from it."
        : `A webhook is installed per repo — every PR push triggers a diff scan. ${selectedCount} selected.`;

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

          {!isNotConnected && isFetching && (
            <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
              Fetching projects…
            </div>
          )}

          {!isNotConnected && !isFetching && candidates?.length === 0 && (
            <div className="rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-text-secondary">
              No projects reachable by this token.
            </div>
          )}

          {!isNotConnected &&
            !isFetching &&
            candidates &&
            candidates.length > 0 && (
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
