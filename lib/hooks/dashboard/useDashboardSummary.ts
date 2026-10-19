import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "@/services/dashboard.service";

import { dashboardKeys } from "./queryKeys";

// Shared by the KPI cards and "Reviews — Last 30 Days" (one request).
export const useDashboardSummary = (orgId: string | undefined) => {
  return useQuery({
    queryKey: dashboardKeys.summary(orgId ?? ""),
    queryFn: () => getDashboardSummary(orgId as string),
    select: (response) => response.data,
    enabled: !!orgId,
  });
};
