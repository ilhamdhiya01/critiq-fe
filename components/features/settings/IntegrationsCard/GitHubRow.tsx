"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  formatConnectedRepoCount,
  getIntegrationStatus,
} from "@/lib/helpers/integration.helper";
import { useDisconnectGitHub } from "@/lib/hooks/integrations/useDisconnectGitHub";
import { useInstallGitHubApps } from "@/lib/hooks/integrations/useInstallGitHubApps";
import type { Integration } from "@/lib/types/integration.types";
import { GITHUB_INSTALLATIONS_URL } from "@/routes";

import SettingsChip from "../SettingsChip";
import ConnectRepositoriesAction from "./ConnectRepositoriesAction";
import NoReposHint from "./NoReposHint";
import StatusBanner from "./StatusBanner";

interface GitHubRowProps {
  orgId: string;
  integration: Integration | null;
  repoCount: number | undefined;
  isAdmin: boolean;
}

const getRemovalSummary = (repoCount: number | undefined): string =>
  repoCount === undefined
    ? "all GitHub repositories"
    : `${repoCount} ${repoCount === 1 ? "repository" : "repositories"}`;

const GitHubRow = React.memo(
  ({ orgId, integration, repoCount, isAdmin }: GitHubRowProps) => {
    const { handleInstallIntentGitHub, isLoading } = useInstallGitHubApps(
      orgId,
      "settings",
    );
    const { handleDisconnectGitHub, isDisconnecting } =
      useDisconnectGitHub(orgId);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleInstall = async () => {
      try {
        await handleInstallIntentGitHub();
        setIsRedirecting(true);
      } catch {
        // Shown as a toast by useInstallGitHubApps.
      }
    };

    const handleCloseConfirm = useCallback(() => setIsConfirmOpen(false), []);

    // On failure (e.g. 502) the dialog stays open so the Admin can retry.
    const handleDisconnect = async () => {
      try {
        await handleDisconnectGitHub();
        setIsConfirmOpen(false);
      } catch {
        // Shown as a toast by useDisconnectGitHub.
      }
    };

    const state = integration?.state;
    const status = integration ? getIntegrationStatus(integration) : null;
    const isActive = state === "ACTIVE";
    const isUninstalled = state === "UNINSTALLED";
    // Connecting repos only works while the App is installed and active.
    const adminRepoCount = isAdmin && isActive ? repoCount : undefined;

    return (
      <div className="flex flex-col gap-3 border-b border-border-row py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-neutral-100">
              GitHub
            </span>
            {integration ? (
              <>
                <span className="font-mono text-[11.5px] text-text-faint">
                  org: {integration.installationLogin ?? "—"}
                  {repoCount !== undefined &&
                    ` · ${formatConnectedRepoCount(repoCount)}`}
                </span>
                {isActive && (
                  <span className="text-[11px] text-text-muted">
                    Webhooks managed by GitHub App
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11.5px] text-text-faint">
                Not connected
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {status && (
              <SettingsChip tone={status.tone}>
                {status.label.toUpperCase()}
              </SettingsChip>
            )}
            {isAdmin && !integration && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={handleInstall}
                isLoading={isLoading || isRedirecting}
              >
                {isRedirecting ? "Redirecting to GitHub…" : "Connect GitHub"}
              </Button>
            )}
          </div>
        </div>

        {status?.message && status.tone !== "green" && (
          <StatusBanner tone={status.tone} message={status.message} />
        )}

        {adminRepoCount === 0 && (
          <NoReposHint orgId={orgId} provider="GITHUB" />
        )}

        {isAdmin && integration && (
          <div className="flex flex-wrap gap-2.5">
            {adminRepoCount !== undefined && adminRepoCount > 0 && (
              <ConnectRepositoriesAction
                orgId={orgId}
                provider="GITHUB"
                label="Connect more"
                variant="ghost"
              />
            )}
            {isUninstalled ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={handleInstall}
                isLoading={isLoading || isRedirecting}
              >
                {isRedirecting ? "Redirecting to GitHub…" : "Reinstall"}
              </Button>
            ) : (
              <Button
                link={GITHUB_INSTALLATIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                fullWidth={false}
              >
                Manage on GitHub
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              size="sm"
              fullWidth={false}
              onClick={() => setIsConfirmOpen(true)}
            >
              Disconnect
            </Button>
          </div>
        )}

        <Modal
          isOpen={isConfirmOpen}
          title="Disconnect GitHub?"
          onClose={handleCloseConfirm}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={handleCloseConfirm}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                fullWidth={false}
                onClick={handleDisconnect}
                isLoading={isDisconnecting}
              >
                Disconnect
              </Button>
            </>
          }
        >
          <p className="text-[12.5px] leading-relaxed text-text-secondary">
            The Critiq app will be uninstalled from{" "}
            <span className="font-mono text-neutral-100">
              {integration?.installationLogin ?? "your GitHub account"}
            </span>{" "}
            on GitHub, and {getRemovalSummary(repoCount)} with their pull
            requests and scan history will be removed from Critiq. This cannot
            be undone.
          </p>
        </Modal>
      </div>
    );
  },
);

GitHubRow.displayName = "GitHubRow";

export default GitHubRow;
