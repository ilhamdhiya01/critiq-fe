import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  CommentThread,
  CreateCommentInput,
  MergePullRequestInput,
  MergePullRequestResult,
  PullRequest,
  PullRequestComment,
  PullRequestDetail,
  PullRequestDiff,
  PullRequestReview,
  PullRequestSummary,
  SubmitReviewInput,
} from "@/lib/types/pull-request.types";
import {
  API_PULL_COMMENT_SYNC,
  API_PULL_COMMENTS,
  API_PULL_DETAIL,
  API_PULL_DETAIL_DIFF,
  API_PULL_DETAIL_SUMMARY,
  API_PULL_MERGE,
  API_PULL_RESCAN,
  API_PULL_REVIEW,
  API_PULL_REVIEW_SYNC,
  API_PULL_REVIEWS,
  API_PULL_SCANS,
  API_PULL_SUMMARY_REGENERATE,
  API_PULLS,
} from "@/routes";

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

export const getPullRequestSummary = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<PullRequestSummary>> => {
  try {
    const res = await axiosInstance.get(
      API_PULL_DETAIL_SUMMARY(orgId, repoId, id),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const regeneratePullRequestSummary = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_SUMMARY_REGENERATE(orgId, repoId, id),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Starts a scan for a PR that has none yet (Admin/Reviewer).
export const scanPullRequest = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.post(API_PULL_SCANS(orgId, repoId, id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Records an Approve / Request changes in Critiq; the BE syncs it to the
// provider in the background (sync.status starts as "pending").
export const submitPullRequestReview = async (
  orgId: string,
  repoId: string,
  id: string,
  input: SubmitReviewInput,
): Promise<ApiResponse<PullRequestReview>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_REVIEW(orgId, repoId, id),
      input,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getPullRequestReviews = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<PullRequestReview[]>> => {
  try {
    const res = await axiosInstance.get(API_PULL_REVIEWS(orgId, repoId, id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const retryReviewSync = async (
  orgId: string,
  repoId: string,
  id: string,
  reviewId: string,
): Promise<ApiResponse<PullRequestReview>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_REVIEW_SYNC(orgId, repoId, id, reviewId),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getPullRequestComments = async (
  orgId: string,
  repoId: string,
  id: string,
): Promise<ApiResponse<{ threads: CommentThread[] }>> => {
  try {
    const res = await axiosInstance.get(API_PULL_COMMENTS(orgId, repoId, id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// General comment, new inline comment, or a reply (`parentId`). The BE syncs
// it to the provider in the background.
export const createPullRequestComment = async (
  orgId: string,
  repoId: string,
  id: string,
  input: CreateCommentInput,
): Promise<ApiResponse<PullRequestComment>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_COMMENTS(orgId, repoId, id),
      input,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const retryCommentSync = async (
  orgId: string,
  repoId: string,
  id: string,
  commentId: string,
): Promise<ApiResponse<PullRequestComment>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_COMMENT_SYNC(orgId, repoId, id, commentId),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Merges on GitHub/GitLab as Critiq; the BE re-checks every blocker first.
export const mergePullRequest = async (
  orgId: string,
  repoId: string,
  id: string,
  input: MergePullRequestInput,
): Promise<ApiResponse<MergePullRequestResult>> => {
  try {
    const res = await axiosInstance.post(
      API_PULL_MERGE(orgId, repoId, id),
      input,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};
