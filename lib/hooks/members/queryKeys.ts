export const membersKeys = {
  all: ["members"] as const,
  // Prefix for one org's members (SSE invalidates this).
  org: (orgId: string) => [...membersKeys.all, orgId] as const,
  list: (orgId: string) => [...membersKeys.org(orgId), "list"] as const,
  invite: (token: string) => [...membersKeys.all, "invite", token] as const,
};
