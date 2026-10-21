import { useMemberships } from "./useMemberships";

export const useOrgBySlug = (slug: string) => {
  const { data: memberships, ...rest } = useMemberships();

  const membership = memberships?.find(
    (item) => item.organization.slug === slug,
  );

  return { ...rest, membership, orgId: membership?.organizationId };
};
