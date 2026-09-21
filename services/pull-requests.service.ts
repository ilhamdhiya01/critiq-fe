import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { PullRequest } from "@/lib/types/pull-request.types";
import { API_PULLS } from "@/routes";

export const getPullRequests = async (
  orgId: string,
): Promise<ApiResponse<PullRequest[]>> => {
  try {
    const res = await axiosInstance.get(API_PULLS(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};
