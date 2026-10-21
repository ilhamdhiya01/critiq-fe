"use client";

import React from "react";

import { useActiveOrgId } from "@/lib/hooks/organisation/useActiveOrg";

import AiProviderCard from "../AiProviderCard";
import IntegrationsCard from "../IntegrationsCard";
import MembersCard from "../MembersCard";
import NotificationsCard from "../NotificationsCard";
import OrganizationCard from "../OrganizationCard";

const SettingsView = React.memo(() => {
  const orgId = useActiveOrgId();

  return (
    <div className="mx-auto flex flex-col gap-4">
      <OrganizationCard />
      <AiProviderCard orgId={orgId} />
      <IntegrationsCard orgId={orgId} />
      <NotificationsCard />
      <MembersCard orgId={orgId} />
    </div>
  );
});

SettingsView.displayName = "SettingsView";

export default SettingsView;
