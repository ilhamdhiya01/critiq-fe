export const searchKeys = {
  all: ["search"] as const,
  query: (orgId: string, q: string) => [...searchKeys.all, orgId, q] as const,
};
