import React, { useMemo } from "react";

import {
  type ActiveOrg,
  ActiveOrgContext,
} from "@/lib/hooks/organisation/useActiveOrg";
import type { Role } from "@/lib/types/auth.types";
import type { MembershipWithOrg } from "@/lib/types/membership.type";

export const TEST_ORG_ID = "org_1";
export const TEST_ORG_SLUG = "acme";

export const buildTestMembership = (
  role: Role,
  orgId: string = TEST_ORG_ID,
  onboardingCompleted = true,
): MembershipWithOrg => ({
  id: `membership_${orgId}`,
  userId: "user_1",
  organizationId: orgId,
  role,
  status: "ACTIVE",
  organization: {
    id: orgId,
    name: "Acme",
    slug: TEST_ORG_SLUG,
    createdBy: "user_1",
    onboardingCompleted,
  },
});

interface ActiveOrgTestProviderProps {
  // Explicit (undefined = memberships still loading).
  orgId: string | undefined;
  // Without a role there is no membership, as before memberships load.
  role?: Role;
  // false = an org without repositories yet.
  onboardingCompleted?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  children: React.ReactNode;
}

// Stands in for ActiveOrgProvider in tests: org pages read the org from
// context and throw without one.
const ActiveOrgTestProvider = ({
  orgId,
  role,
  onboardingCompleted = true,
  isLoading = false,
  isError = false,
  children,
}: ActiveOrgTestProviderProps) => {
  const value = useMemo<ActiveOrg>(
    () => ({
      orgId,
      membership:
        role && orgId
          ? buildTestMembership(role, orgId, onboardingCompleted)
          : undefined,
      isLoading,
      isError,
    }),
    [orgId, role, onboardingCompleted, isLoading, isError],
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
};

export default ActiveOrgTestProvider;
