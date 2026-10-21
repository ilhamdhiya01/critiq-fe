"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

import { saveLastOrgSlug } from "@/lib/helpers/last-org.helper";
import {
  type ActiveOrg,
  ActiveOrgContext,
} from "@/lib/hooks/organisation/useActiveOrg";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { ROUTES } from "@/routes";

// Resolves the org from the URL slug (not the session token, which only knows
// the org active when it was issued), so switching orgs is just navigating to
// another slug.
const ActiveOrgProvider = ({ children }: { children: React.ReactNode }) => {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { membership, isSuccess, isLoading, isError } = useOrgBySlug(slug);

  const isUnknown = isSuccess && !membership;

  // Every org opens, finished or not: an unfinished one shows OrgSetupBanner
  // (DashboardLayout) instead of being sent back to the wizard.
  useEffect(() => {
    if (isUnknown) {
      router.replace(ROUTES.ROOT);
    } else if (membership) {
      saveLastOrgSlug(slug);
    }
  }, [isUnknown, membership, router, slug]);

  // One stable object, so consumers re-render only when the org changes.
  const value = useMemo<ActiveOrg>(
    () => ({
      orgId: membership?.organizationId,
      membership,
      isLoading,
      isError,
    }),
    [membership, isLoading, isError],
  );

  if (isUnknown) return null;

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
};

export default ActiveOrgProvider;
