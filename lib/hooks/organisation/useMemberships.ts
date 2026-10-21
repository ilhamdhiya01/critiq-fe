import { useQuery } from "@tanstack/react-query";

import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";

// Every org the user belongs to (GET /me/orgs), incl. each org's
// onboardingCompleted.
export const useMemberships = () =>
  useQuery({
    queryKey: membershipWithOrgKeys.all,
    queryFn: () => getMembershipWithOrg(),
    select: (response) => response.data ?? [],
    retry: false,
  });
