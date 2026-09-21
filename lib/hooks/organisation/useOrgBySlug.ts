import { useQuery } from "@tanstack/react-query";

import { membershipWithOrgKeys } from "@/lib/hooks/integrations/queryKeys";
import { getMembershipWithOrg } from "@/services/membership-with-org.service";

export const useOrgBySlug = (slug: string) => {
  const { data: memberships, ...rest } = useQuery({
    queryKey: membershipWithOrgKeys.all,
    queryFn: () => getMembershipWithOrg(),
    select: (response) => response.data ?? [],
    retry: false,
  });

  const membership = memberships?.find(
    (item) => item.organization.slug === slug,
  );

  return { ...rest, orgId: membership?.organizationId };
};
