"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import { GITHUB_PENDING_APPROVAL_MESSAGE } from "@/const/integration.constant";
import { useInstallGitHubApps } from "@/lib/hooks/integrations/useInstallGitHubApps";

interface GitHubPendingApprovalProps {
  orgId: string;
  onUseGitLab: () => void;
  onSkip: () => void;
}

// GitHub sent the install request to the org owner; no repositories can be
// listed until they approve and the Admin connects again.
const GitHubPendingApproval = React.memo(
  ({ orgId, onUseGitLab, onSkip }: GitHubPendingApprovalProps) => {
    const { handleInstallIntentGitHub, isLoading } =
      useInstallGitHubApps(orgId);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleConnect = useCallback(async () => {
      try {
        await handleInstallIntentGitHub();
        setIsRedirecting(true);
      } catch {
        // Shown as a toast by useInstallGitHubApps.
      }
    }, [handleInstallIntentGitHub]);

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-3.5">
        <span className="text-[13px] font-semibold text-neutral-100">
          Waiting for owner approval
        </span>
        <Notice tone="warning">{GITHUB_PENDING_APPROVAL_MESSAGE}</Notice>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={onSkip}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={onUseGitLab}
          >
            Use GitLab instead
          </Button>
          <Button
            type="button"
            size="sm"
            fullWidth={false}
            onClick={handleConnect}
            isLoading={isLoading || isRedirecting}
          >
            {isRedirecting ? "Redirecting to GitHub…" : "Connect GitHub"}
          </Button>
        </div>
      </div>
    );
  },
);

GitHubPendingApproval.displayName = "GitHubPendingApproval";

export default GitHubPendingApproval;
