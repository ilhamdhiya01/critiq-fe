"use client";

import { useParams } from "next/navigation";
import React, { Suspense } from "react";

import { useIntegrations } from "@/lib/hooks/integrations/useIntegrations";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { useRepoCountByProvider } from "@/lib/hooks/repositories/useRepoCountByProvider";

import GitHubReturnNotice from "./GitHubReturnNotice";
import GitHubRow from "./GitHubRow";
import GitLabRow from "./GitLabRow";
import IntegrationsCardSkeleton from "./IntegrationsCardSkeleton";

interface IntegrationsCardProps {
  orgId?: string;
}

const IntegrationsCard = React.memo(({ orgId }: IntegrationsCardProps) => {
  const params = useParams<{ slug: string }>();
  const { membership } = useOrgBySlug(params.slug);
  const isAdmin = membership?.role === "ADMIN";

  const { data: integrations, isLoading, isError } = useIntegrations(orgId);
  const { data: repoCounts } = useRepoCountByProvider(orgId);

  const renderBody = () => {
    if (isError || !orgId) {
      return (
        <p className="text-[12.5px] text-danger-light">
          Failed to load integrations. Reload the page to try again.
        </p>
      );
    }
    if (isLoading || !integrations) return <IntegrationsCardSkeleton />;

    return (
      <div className="flex flex-col">
        <GitHubRow
          orgId={orgId}
          integration={integrations.github}
          repoCount={repoCounts?.GITHUB}
          isAdmin={isAdmin}
        />
        <GitLabRow
          orgId={orgId}
          integration={integrations.gitlab}
          repoCount={repoCounts?.GITLAB}
          isAdmin={isAdmin}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border-subtle bg-surface px-5 py-4.5">
      <span className="font-mono text-[13px] font-semibold text-text-strong">
        Integrations
      </span>

      {renderBody()}

      <Suspense fallback={null}>
        <GitHubReturnNotice />
      </Suspense>
    </div>
  );
});

IntegrationsCard.displayName = "IntegrationsCard";

export default IntegrationsCard;
