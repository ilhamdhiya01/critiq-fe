"use client";

import { useParams } from "next/navigation";
import React from "react";

import ConnectRepositoriesAction from "@/components/shared/connect-repositories-action";
import Button from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import { getConnectableProvider } from "@/lib/helpers/integration.helper";
import { useIntegrations } from "@/lib/hooks/integrations/useIntegrations";
import { useActiveOrg } from "@/lib/hooks/organisation/useActiveOrg";
import { ROUTES } from "@/routes";

// Shown on every org page while the org has no repository yet
// (organization.onboardingCompleted === false). Connecting the first repo
// refreshes memberships, so it disappears by itself.
const OrgSetupBanner = React.memo(() => {
  const params = useParams<{ slug: string }>();
  const { orgId, membership } = useActiveOrg();
  const isUnfinished = membership?.organization.onboardingCompleted === false;
  const isAdmin = membership?.role === "ADMIN";

  // Only an Admin of an unfinished org needs the integration state.
  const { data: integrations } = useIntegrations(
    isUnfinished && isAdmin ? orgId : undefined,
  );

  if (!isUnfinished || !membership || !orgId) return null;

  if (!isAdmin) {
    return (
      <Notice tone="note" icon="TbPlugConnected" className="mb-4">
        This organization has no repositories yet. Ask an Admin to connect one.
      </Notice>
    );
  }

  const provider = getConnectableProvider(integrations);

  return (
    <Notice
      tone="note"
      icon="TbPlugConnected"
      className="mb-4 flex items-center"
    >
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="min-w-0 flex-1">
          Finish setting up {membership.organization.name}: connect GitHub or
          GitLab and add a repository to start reviewing.
        </span>
        <span className="flex shrink-0 gap-2">
          <Button
            link={`${ROUTES.settings(params.slug)}#integrations`}
            variant="ghost"
            size="sm"
            fullWidth={false}
          >
            Connect
          </Button>
          <ConnectRepositoriesAction
            orgId={orgId}
            provider={provider ?? "GITHUB"}
            label="Add repository"
            variant="secondary"
            disabled={!provider}
            title={provider ? undefined : "Connect GitHub or GitLab first"}
          />
        </span>
      </span>
    </Notice>
  );
});

OrgSetupBanner.displayName = "OrgSetupBanner";

export default OrgSetupBanner;
