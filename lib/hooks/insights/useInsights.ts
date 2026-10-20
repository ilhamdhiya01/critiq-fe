import { useQuery } from "@tanstack/react-query";

import { getInsights } from "@/services/insights.service";

import { insightsKeys } from "./queryKeys";

export const INSIGHTS_DEFAULT_WEEKS = 8;

// One request feeds every block on the page; SSE refreshes it.
export const useInsights = (
  orgId: string | undefined,
  weeks = INSIGHTS_DEFAULT_WEEKS,
) => {
  return useQuery({
    queryKey: insightsKeys.detail(orgId ?? "", weeks),
    queryFn: () => getInsights(orgId as string, weeks),
    select: (response) => response.data,
    enabled: !!orgId,
  });
};
