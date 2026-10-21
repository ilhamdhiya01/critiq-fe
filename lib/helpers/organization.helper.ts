import { NAVIGATION_ITEMS } from "@/const/navigation.constant";
import type { MembershipWithOrg } from "@/lib/types/membership.type";
import { ROUTES } from "@/routes";

// Where "/" lands: the last org opened (if still a member), else the first
// org whose setup is done, else the first org.
export const pickLandingMembership = (
  memberships: readonly MembershipWithOrg[],
  lastSlug: string | null,
): MembershipWithOrg | null =>
  (lastSlug &&
    memberships.find((item) => item.organization.slug === lastSlug)) ||
  memberships.find((item) => item.organization.onboardingCompleted) ||
  memberships[0] ||
  null;

// Where the wizard's Cancel / Skip goes when leaving for another org: the last
// org opened, else the first other one (never `excludeOrgId`, the org being
// set up). Every org opens now, finished or not.
export const pickExitMembership = (
  memberships: readonly MembershipWithOrg[],
  lastSlug: string | null,
  excludeOrgId?: string | null,
): MembershipWithOrg | null => {
  const others = memberships.filter(
    (item) => item.organizationId !== excludeOrgId,
  );
  return (
    (lastSlug && others.find((item) => item.organization.slug === lastSlug)) ||
    others[0] ||
    null
  );
};

// Switching org keeps the user in the same menu (/acme/settings →
// /beta/settings). A detail page (/acme/pull-requests/pr_1) belongs to the old
// org, so it lands on that menu's list instead; anything else on the
// dashboard.
export const getOrgSwitchHref = (
  pathname: string,
  nextSlug: string,
): string => {
  const section = pathname.split("/").filter(Boolean)[1];
  const item = section
    ? NAVIGATION_ITEMS.find(
        (navItem) => navItem.buildHref("_").split("/")[2] === section,
      )
    : undefined;
  return item ? item.buildHref(nextSlug) : ROUTES.dashboard(nextSlug);
};
