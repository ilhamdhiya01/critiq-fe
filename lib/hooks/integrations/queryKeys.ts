export const integrationKeys = {
  all: ["integrations"] as const,
  candidates: (orgId: string, source: "github" | "gitlab") =>
    [...integrationKeys.all, "candidates", orgId, source] as const,
};

export const membershipWithOrgKeys = {
  all: ["memberships"] as const,
  detail: (id: string) => [...membershipWithOrgKeys.all, id] as const,
};
