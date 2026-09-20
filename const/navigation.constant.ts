import type { IconName } from "@/components/ui/icon/Icon";
import { ROUTES } from "@/routes";

export interface NavigationItem {
  label: string;
  icon: IconName;
  buildHref: (slug: string) => string;
}

// Order mirrors the product flow: overview, then the review queue, then what
// is being reviewed, then configuration. Every destination is scoped to the
// active organization, so each item builds its href from the slug.
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: "Dashboard", icon: "TbLayoutGrid", buildHref: ROUTES.dashboard },
  {
    label: "Pull Requests",
    icon: "TbGitPullRequest",
    buildHref: ROUTES.pullRequests,
  },
  { label: "Repositories", icon: "TbFolder", buildHref: ROUTES.repositories },
  {
    label: "Rules & Profiles",
    icon: "TbAdjustmentsHorizontal",
    buildHref: ROUTES.rules,
  },
  { label: "Activity", icon: "TbClock", buildHref: ROUTES.activity },
  { label: "Insights", icon: "TbChartBar", buildHref: ROUTES.insights },
  { label: "Settings", icon: "TbSettings", buildHref: ROUTES.settings },
] as const;
