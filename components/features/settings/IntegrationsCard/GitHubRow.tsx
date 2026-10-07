"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import { getIntegrationStatus } from "@/lib/helpers/integration.helper";
import { useInstallGitHubApps } from "@/lib/hooks/integrations/useInstallGitHubApps";
import type { Integration } from "@/lib/types/integration.types";
import { GITHUB_INSTALLATIONS_URL } from "@/routes";

import SettingsChip from "../SettingsChip";

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

    return (
      <div className="flex items-center justify-between gap-4 border-b border-border-row py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-neutral-100">
            GitHub
          </span>
          {integration ? (
            <>
              <span className="font-mono text-[11.5px] text-text-faint">
                org: {integration.installationLogin ?? "—"}
                {repoCount !== undefined &&
                  ` · ${repoCount} ${repoCount === 1 ? "repo" : "repos"}`}
              </span>
              <span className="text-[11px] text-text-muted">
                Webhooks managed by GitHub App
              </span>
            </>
          ) : (
            <span className="text-[11.5px] text-text-faint">Not connected</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {status && (
            <SettingsChip tone={status.tone}>
              {status.label.toUpperCase()}
            </SettingsChip>
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
    );
  },
);

GitHubRow.displayName = "GitHubRow";

export default GitHubRow;
