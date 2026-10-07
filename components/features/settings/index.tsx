import { default as AiProviderCard } from "./AiProviderCard";
import { default as IntegrationsCard } from "./IntegrationsCard";
import { default as MembersCard } from "./MembersCard";
import { default as NotificationsCard } from "./NotificationsCard";
import { default as OrganizationCard } from "./OrganizationCard";
import { default as SettingsView } from "./SettingsView";

export const Settings = {
  SettingsView,
  OrganizationCard,
  AiProviderCard,
  IntegrationsCard,
  NotificationsCard,
  MembersCard,
} as const;
