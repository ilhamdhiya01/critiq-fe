"use client";

import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useState } from "react";

import BranchPolicyOptions from "@/components/shared/branch-policy-options";
import GitHubAccessNotice from "@/components/shared/github-access-notice";
import RepoPicker from "@/components/shared/repo-picker";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal";
import {
  CANDIDATES_TOKEN_EXPIRED_MESSAGE,
  CONNECT_REPOS_FORBIDDEN_MESSAGE,
  DEFAULT_BRANCH_POLICY,
} from "@/const/repository.constant";
import { isGitHubAccessError } from "@/lib/helpers/integration.helper";
import { summarizeConnectResult } from "@/lib/helpers/repository.helper";
import { integrationKeys } from "@/lib/hooks/integrations/queryKeys";
import { useConnectRepositories } from "@/lib/hooks/integrations/useConnectRepositories";
import { useIntegrationCandidates } from "@/lib/hooks/integrations/useIntegrationCandidates";
import { useConnectedRepoPaths } from "@/lib/hooks/repositories/useConnectedRepoPaths";
import { useRepoSelection } from "@/lib/hooks/repositories/useRepoSelection";
import { toast } from "@/lib/toast";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type { BranchPolicy } from "@/lib/types/repository.types";
import { GITHUB_INSTALLATIONS_URL } from "@/routes";

interface ConnectRepositoriesModalProps {
  orgId: string;
  provider: IntegrationProvider;
  onClose: () => void;
}

const getCandidatesErrorMessage = (
  code: string | null,
  status: number | null,
): string => {
  if (code === "token_expired") return CANDIDATES_TOKEN_EXPIRED_MESSAGE;
  if (status === 403) return CONNECT_REPOS_FORBIDDEN_MESSAGE;
  return "Failed to load repositories.";
};

// Mounted only while open, so the live candidates call never runs on page
// load or for non-Admins.
const ConnectRepositoriesModal = React.memo(
  ({ orgId, provider, onClose }: ConnectRepositoriesModalProps) => {
    const queryClient = useQueryClient();
    const source = provider === "GITHUB" ? "github" : "gitlab";
    const providerLabel = provider === "GITHUB" ? "GitHub" : "GitLab";

    const {
      data: candidates,
      isLoading,
      isError,
      isNotConnected,
      errorCode,
      errorStatus,
      refetch,
    } = useIntegrationCandidates(orgId, source, true);
    const { data: connectedPaths } = useConnectedRepoPaths(orgId, provider);
    const {
      selectedRepos,
      selectedBranches,
      selectedCount,
      toggleRepo,
      toggleBranch,
      markBranchesReady,
      deselectRepos,
      toProjects,
    } = useRepoSelection();
    const { handleConnectRepositories, isConnectingRepos } =
      useConnectRepositories(orgId);

    const [isBranchBlocked, setIsBranchBlocked] = useState(false);
    const [policy, setPolicy] = useState<BranchPolicy>(DEFAULT_BRANCH_POLICY);
    const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
    const [webhookWarnings, setWebhookWarnings] = useState<
      { path: string; message: string }[]
    >([]);

    // The integration was removed elsewhere — nothing to pick from.
    useEffect(() => {
      if (!isNotConnected) return;
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(orgId) });
      onClose();
    }, [isNotConnected, orgId, onClose, queryClient]);

    // The App was uninstalled/suspended on GitHub: refresh the card so it
    // shows the new state behind the modal.
    const hasGitHubAccessError = isGitHubAccessError(errorCode);
    useEffect(() => {
      if (!hasGitHubAccessError) return;
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(orgId) });
    }, [hasGitHubAccessError, orgId, queryClient]);

    const handleToggleRepo = useCallback(
      (id: string) => {
        toggleRepo(id);
        setRowErrors((prev) => {
          if (!(id in prev)) return prev;
          const rest = { ...prev };
          delete rest[id];
          return rest;
        });
      },
      [toggleRepo],
    );

    const handleSubmit = async () => {
      try {
        const response = await handleConnectRepositories({
          source,
          projects: toProjects(),
          defaultPolicy: policy,
        });
        const summary = summarizeConnectResult(
          response.data.items,
          candidates ?? [],
          providerLabel,
        );

        if (summary.failedCount === 0) {
          toast.success(
            `${summary.okCount} ${summary.okCount === 1 ? "repository" : "repositories"} connected`,
          );
          summary.webhookWarnings.forEach((warning) =>
            toast.warning(warning.path, { description: warning.message }),
          );
          onClose();
          return;
        }

        deselectRepos(summary.okCandidateIds);
        setRowErrors(summary.rowErrors);
        setWebhookWarnings(summary.webhookWarnings);
      } catch {
        // Shown as a toast by useConnectRepositories.
      }
    };

    const renderBody = () => {
      if (hasGitHubAccessError) return <GitHubAccessNotice />;

      if (isError && !isNotConnected) {
        return (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle px-3.5 py-4 text-center text-[12.5px] text-danger-light">
            {getCandidatesErrorMessage(errorCode, errorStatus)}
            {errorCode !== "token_expired" && errorStatus !== 403 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            )}
          </div>
        );
      }

      return (
        <RepoPicker
          organizationId={orgId}
          source={source}
          candidates={candidates}
          isLoading={isLoading}
          selectedRepos={selectedRepos}
          selectedBranches={selectedBranches}
          onToggleRepo={handleToggleRepo}
          onToggleBranch={toggleBranch}
          onBranchesReady={markBranchesReady}
          onBlockedChange={setIsBranchBlocked}
          connectedPaths={connectedPaths}
          rowErrors={rowErrors}
          listClassName="max-h-72"
          emptyState={
            provider === "GITHUB" ? (
              <span className="flex flex-col items-center gap-2.5">
                No repositories granted to the Critiq app
                <Button
                  link={GITHUB_INSTALLATIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                >
                  Choose repositories on GitHub
                </Button>
              </span>
            ) : (
              "No projects reachable by this token."
            )
          }
        />
      );
    };

    const isSubmitDisabled =
      selectedCount === 0 || isBranchBlocked || isConnectingRepos;

    return (
      <Modal
        isOpen
        title={`Connect ${providerLabel} repositories`}
        onClose={onClose}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              isLoading={isConnectingRepos}
            >
              {selectedCount > 0
                ? `Connect ${selectedCount} ${selectedCount === 1 ? "repository" : "repositories"}`
                : "Connect repositories"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Repositories
            </span>
            <span className="text-[11.5px] leading-normal text-text-faint">
              Pick the repos Critiq should scan and the branches to monitor.
              Repos already connected are marked and cannot be picked again.
            </span>
            {renderBody()}
            {webhookWarnings.map((warning) => (
              <span
                key={warning.path}
                className="flex items-start gap-1.5 text-[11px] leading-normal text-warning-light"
              >
                <Icon
                  icon="TbAlertTriangle"
                  size={13}
                  className="mt-px flex-none"
                />
                <span>
                  <span className="font-mono">{warning.path}</span> —{" "}
                  {warning.message}
                </span>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase">
              Default review policy
            </span>
            <BranchPolicyOptions value={policy} onChange={setPolicy} />
          </div>
        </div>
      </Modal>
    );
  },
);

ConnectRepositoriesModal.displayName = "ConnectRepositoriesModal";

export default ConnectRepositoriesModal;
