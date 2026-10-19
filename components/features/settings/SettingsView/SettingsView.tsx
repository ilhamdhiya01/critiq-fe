"use client";

import React from "react";

import AiProviderCard from "../AiProviderCard";
import IntegrationsCard from "../IntegrationsCard";
import MembersCard from "../MembersCard";
import NotificationsCard from "../NotificationsCard";
import OrganizationCard from "../OrganizationCard";

interface SettingsViewProps {
  orgId?: string;
}

const SettingsView = React.memo(({ orgId }: SettingsViewProps) => {
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
