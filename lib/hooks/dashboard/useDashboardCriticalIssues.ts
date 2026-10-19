import { useQuery } from "@tanstack/react-query";

import { getDashboardCriticalIssues } from "@/services/dashboard.service";

import { dashboardKeys } from "./queryKeys";

export const useDashboardCriticalIssues = (
  orgId: string | undefined,
  limit: number,
  enabled = true,
) => {
  return useQuery({
    queryKey: dashboardKeys.criticalIssues(orgId ?? "", limit),
    queryFn: () => getDashboardCriticalIssues(orgId as string, limit),
    select: (response) => response.data ?? [],
    enabled: enabled && !!orgId,
  });
};
