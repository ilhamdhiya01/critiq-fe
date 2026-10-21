import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { getMembershipWithOrg } from "@/services/membership-with-org.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import { membershipWithOrgKeys } from "./queryKeys";

// Fills the wizard with the org being set up (`orgId`; skip it with
// `undefined` when starting a new one).
export const useMembershipWithOrg = (orgId: string | undefined) => {
  const { setOrganisationSaved, setOrganisationName } = useOnboardingStore(
    useShallow((state) => ({
      setOrganisationName: state.setOrganisationName,
      setOrganisationSaved: state.setOrganisationSaved,
    })),
  );

  const { data: response, ...rest } = useQuery({
    queryKey: membershipWithOrgKeys.all,
    queryFn: () => getMembershipWithOrg(),
    retry: false,
  });

  const activeOrganization = orgId
    ? response?.data.find((item) => item.organizationId === orgId)
    : undefined;

  useEffect(() => {
    if (activeOrganization) {
      setOrganisationName(activeOrganization.organization.name);
      setOrganisationSaved({
        id: activeOrganization.organizationId,
        name: activeOrganization.organization.name,
        slug: activeOrganization.organization.slug,
      });
    }
  }, [activeOrganization, setOrganisationName, setOrganisationSaved]);

  return {
    ...rest,
    organizations: response?.data,
    orgSlug: activeOrganization?.organization.slug || "",
  };
};
