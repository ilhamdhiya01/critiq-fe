import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { GlobalSearchResult } from "@/lib/types/search.types";
import { API_ORG_SEARCH } from "@/routes";

export const getGlobalSearch = async (
  orgId: string,
  q: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<ApiResponse<GlobalSearchResult>> => {
  try {
    const res = await axiosInstance.get(API_ORG_SEARCH(orgId), {
      params: { q, limit: options?.limit },
      signal: options?.signal,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
