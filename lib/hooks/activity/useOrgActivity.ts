import { useInfiniteQuery } from "@tanstack/react-query";

import { ACTIVITY_PAGE_SIZE } from "@/const/activity.constant";
import type { ActivityFilters, ActivityPage } from "@/lib/types/activity.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { getOrgActivity } from "@/services/activity.service";

import { activityKeys } from "./queryKeys";

// The cursor always comes from the BE; null means the list is exhausted.
export const getActivityNextPageParam = (
  lastPage: ApiResponse<ActivityPage>,
): string | undefined => lastPage.data?.nextCursor ?? undefined;

// A new filter is a new query key, so it starts again from page 1.
export const useOrgActivity = (
  orgId: string | undefined,
  filters: ActivityFilters,
) => {
  return useInfiniteQuery({
    queryKey: activityKeys.list(orgId ?? "", filters),
    queryFn: ({ pageParam }) =>
      getOrgActivity(orgId as string, {
        ...filters,
        cursor: pageParam,
        limit: ACTIVITY_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getActivityNextPageParam,
    enabled: !!orgId,
  });
};
