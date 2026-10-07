"use client";

import React from "react";

import AiProviderCard from "../AiProviderCard";
import IntegrationsCard from "../IntegrationsCard";
import MembersCard from "../MembersCard";
import NotificationsCard from "../NotificationsCard";
import OrganizationCard from "../OrganizationCard";

const SettingsView = React.memo(() => {
  return (
    <div className="mx-auto flex max-w-190 flex-col gap-4">
      <OrganizationCard />
      <AiProviderCard />
      <IntegrationsCard />
      <NotificationsCard />
      <MembersCard />
    </div>
  );
});

SettingsView.displayName = "SettingsView";

export default SettingsView;
