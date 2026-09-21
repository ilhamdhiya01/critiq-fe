import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { getMembershipWithOrg } from "@/services/membership-with-org.service";
import { useOnboardingStore } from "@/stores/onboarding/useOnboardingStore";

import { membershipWithOrgKeys } from "./queryKeys";

export const useMembershipWithOrg = (activeOrgId: string) => {
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

  const activeOrganization = response?.data.find(
    (item) => item.organizationId === activeOrgId,
  );

  useEffect(() => {
    if (activeOrganization) {
      setOrganisationName(activeOrganization.organization.name);
      setOrganisationSaved({
        id: activeOrganization.organizationId,
        name: activeOrganization.organization.name,
      });
    }
  }, [activeOrganization, setOrganisationName, setOrganisationSaved]);

  return {
    ...rest,
    organizations: response?.data,
    orgSlug: activeOrganization?.organization.slug || "",
  };
};
