import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { InsightsData } from "@/lib/types/insights.types";
import { API_INSIGHTS } from "@/routes";

export const getInsights = async (
  orgId: string,
  weeks: number,
): Promise<ApiResponse<InsightsData>> => {
  try {
    const res = await axiosInstance.get(API_INSIGHTS(orgId), {
      params: { weeks },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
