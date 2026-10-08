"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import {
  formatConnectedRepoCount,
  getIntegrationStatus,
} from "@/lib/helpers/integration.helper";
import { useInstallGitHubApps } from "@/lib/hooks/integrations/useInstallGitHubApps";
import type { Integration } from "@/lib/types/integration.types";
import { GITHUB_INSTALLATIONS_URL } from "@/routes";

import SettingsChip from "../SettingsChip";
import ConnectRepositoriesAction from "./ConnectRepositoriesAction";
import NoReposHint from "./NoReposHint";

interface GitHubRowProps {
  orgId: string;
  integration: Integration | null;
  repoCount: number | undefined;
  isAdmin: boolean;
}

const GitHubRow = React.memo(
  ({ orgId, integration, repoCount, isAdmin }: GitHubRowProps) => {
    const { handleInstallIntentGitHub, isLoading } = useInstallGitHubApps(
      orgId,
      "settings",
    );
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleConnect = async () => {
      try {
        await handleInstallIntentGitHub();
        setIsRedirecting(true);
      } catch {
        // Shown as a toast by useInstallGitHubApps.
      }
    };

    const status = integration ? getIntegrationStatus(integration) : null;
    // Defined only when the Admin may connect repos and the count has loaded.
    const adminRepoCount = isAdmin && integration ? repoCount : undefined;

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
                <span className="text-[11px] text-text-muted">
                  Webhooks managed by GitHub App
                </span>
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
            {adminRepoCount !== undefined && adminRepoCount > 0 && (
              <ConnectRepositoriesAction
                orgId={orgId}
                provider="GITHUB"
                label="Connect more"
                variant="ghost"
              />
            )}
            {isAdmin && integration && (
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
            {isAdmin && !integration && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={handleConnect}
                isLoading={isLoading || isRedirecting}
              >
                {isRedirecting ? "Redirecting to GitHub…" : "Connect GitHub"}
              </Button>
            )}
          </div>
        </div>

        {adminRepoCount === 0 && (
          <NoReposHint orgId={orgId} provider="GITHUB" />
        )}
      </div>
    );
  },
);

GitHubRow.displayName = "GitHubRow";

export default GitHubRow;
