import { createContext, useContext } from "react";

import type { MembershipWithOrg } from "@/lib/types/membership.type";

// The org named by the URL slug, resolved once by ActiveOrgProvider
// (app/[slug]/layout.tsx). Org pages read it from here, never from the
// session token (which only knows the org active when it was issued).
export interface ActiveOrg {
  // Undefined while memberships load, or when they failed.
  orgId: string | undefined;
  // The current user's membership in it (role, organization).
  membership: MembershipWithOrg | undefined;
  isLoading: boolean;
  isError: boolean;
}

// null = no provider, which is a bug; distinct from an org still loading.
export const ActiveOrgContext = createContext<ActiveOrg | null>(null);

export const useActiveOrg = (): ActiveOrg => {
  const activeOrg = useContext(ActiveOrgContext);
  if (!activeOrg) {
    throw new Error(
      "useActiveOrg must be used inside ActiveOrgProvider (app/[slug]/layout.tsx).",
    );
  }
  return activeOrg;
};

export const useActiveOrgId = (): string | undefined => useActiveOrg().orgId;

export const useActiveMembership = (): MembershipWithOrg | undefined =>
  useActiveOrg().membership;
