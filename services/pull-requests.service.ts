import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  PullRequest,
  PullRequestDetail,
  PullRequestDiff,
} from "@/lib/types/pull-request.types";
import { API_PULL_DETAIL, API_PULL_DETAIL_DIFF, API_PULLS } from "@/routes";

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

export const getPullRequestDetail = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<PullRequestDetail>> => {
  try {
    const res = await axiosInstance.get(API_PULL_DETAIL(orgId, repoId, id));
    return res.data;
  } catch (error) {
    throw error;
  }
};
export const getPullRequestDetailDiff = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<PullRequestDiff>> => {
  try {
    const res = await axiosInstance.get(
      API_PULL_DETAIL_DIFF(orgId, repoId, id),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};
