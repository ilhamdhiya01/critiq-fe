import axiosInstance from "@/lib/axios";
import type { ActivityFilters, ActivityPage } from "@/lib/types/activity.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { API_ORG_ACTIVITY } from "@/routes";

// "all" filters and a missing cursor are simply left out of the query.
export const getOrgActivity = async (
  orgId: string,
  {
    decision,
    mode,
    cursor,
    limit,
  }: ActivityFilters & { cursor?: string; limit: number },
): Promise<ApiResponse<ActivityPage>> => {
  try {
    const res = await axiosInstance.get(API_ORG_ACTIVITY(orgId), {
      params: {
        limit,
        ...(decision !== "all" && { decision }),
        ...(mode !== "all" && { mode }),
        ...(cursor && { cursor }),
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
