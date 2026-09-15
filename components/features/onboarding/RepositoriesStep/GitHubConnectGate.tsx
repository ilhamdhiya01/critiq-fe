"use client";

import React, { useCallback } from "react";

import Button from "@/components/ui/button";
import { useInstallGitHubApps } from "@/lib/hooks/integrations/useInstallGitHubApps";

interface GitHubConnectGateProps {
  orgId: string;
}

const GitHubConnectGate = React.memo(({ orgId }: GitHubConnectGateProps) => {
  const { handleInstallIntentGitHub, isLoading } = useInstallGitHubApps(orgId);

  const handleInstallClick = useCallback(async () => {
    try {
      await handleInstallIntentGitHub();
      // redirect ke GitHub terjadi di onSuccess milik useInstallGitHubApps
    } catch {
      // error sudah ditampilkan via toast oleh useInstallGitHubApps
    }
  }, [handleInstallIntentGitHub]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border-default px-2 py-0.5 font-mono text-[10px] tracking-[.06em] text-text-secondary uppercase">
          GitHub
        </span>
        <span className="text-[13px] font-semibold text-neutral-100">
          Connect GitHub
        </span>
      </div>
      <p className="text-[11.5px] leading-normal text-text-muted">
        Install the Critiq GitHub App on your organization or account. GitHub
        will ask which repositories to grant — you can change this later.
        You&apos;ll be sent back here when it&apos;s done.
      </p>

      <div className="flex justify-end">
        <Button
          size="md"
          fullWidth={false}
          onClick={handleInstallClick}
          isLoading={isLoading}
        >
          Install Critiq on GitHub
        </Button>
      </div>
    </div>
  );
});

GitHubConnectGate.displayName = "GitHubConnectGate";

export default GitHubConnectGate;
