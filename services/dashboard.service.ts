import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  DashboardCriticalIssue,
  DashboardRecentReview,
  DashboardSummary,
} from "@/lib/types/dashboard.types";
import {
  API_DASHBOARD_CRITICAL_ISSUES,
  API_DASHBOARD_RECENT_REVIEWS,
  API_DASHBOARD_SUMMARY,
} from "@/routes";

export const getDashboardSummary = async (
  orgId: string,
): Promise<ApiResponse<DashboardSummary>> => {
  try {
    const res = await axiosInstance.get(API_DASHBOARD_SUMMARY(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardCriticalIssues = async (
  orgId: string,
  limit: number,
): Promise<ApiResponse<DashboardCriticalIssue[]>> => {
  try {
    const res = await axiosInstance.get(API_DASHBOARD_CRITICAL_ISSUES(orgId), {
      params: { limit },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardRecentReviews = async (
  orgId: string,
  limit: number,
): Promise<ApiResponse<DashboardRecentReview[]>> => {
  try {
    const res = await axiosInstance.get(API_DASHBOARD_RECENT_REVIEWS(orgId), {
      params: { limit },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
