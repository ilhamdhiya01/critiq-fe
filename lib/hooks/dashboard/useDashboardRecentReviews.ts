import { useQuery } from "@tanstack/react-query";

import { getDashboardRecentReviews } from "@/services/dashboard.service";

import { dashboardKeys } from "./queryKeys";

export const useDashboardRecentReviews = (
  orgId: string | undefined,
  limit: number,
) => {
  return useQuery({
    queryKey: dashboardKeys.recentReviews(orgId ?? "", limit),
    queryFn: () => getDashboardRecentReviews(orgId as string, limit),
    select: (response) => response.data ?? [],
    enabled: !!orgId,
  });
};
