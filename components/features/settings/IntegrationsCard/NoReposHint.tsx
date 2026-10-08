import React from "react";

import type { IntegrationProvider } from "@/lib/types/integration.types";

import ConnectRepositoriesAction from "./ConnectRepositoriesAction";

interface NoReposHintProps {
  orgId: string;
  provider: IntegrationProvider;
}

const NoReposHint = React.memo(({ orgId, provider }: NoReposHintProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-row bg-raised px-3.5 py-2.5">
    <span className="text-[11.5px] text-text-secondary">
      No repositories connected yet — pick which ones Critiq scans.
    </span>
    <ConnectRepositoriesAction
      orgId={orgId}
      provider={provider}
      label="Connect repositories"
      variant="secondary"
    />
  </div>
));

NoReposHint.displayName = "NoReposHint";

export default NoReposHint;
