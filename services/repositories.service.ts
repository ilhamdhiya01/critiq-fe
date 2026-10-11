import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { RepoBranches } from "@/lib/types/integration.types";
import type { PullRequest } from "@/lib/types/pull-request.types";
import type {
  ConnectRepositoryInput,
  OrgRepository,
  RepoScan,
  Repository,
  ScanConfig,
  ScanHistoryEntry,
  UpdateScanConfigInput,
} from "@/lib/types/repository.types";
import {
  API_CONNECT_REPOS,
  API_ORG_REPO_BRANCHES,
  API_ORG_REPO_PULLS,
  API_ORG_REPO_SCANS,
  API_PULL_RESCAN,
  API_REPO_DETAIL,
  API_REPO_RESCAN,
  API_REPO_SCAN_CONFIG,
  API_REPO_SCANS,
  API_REPOS,
} from "@/routes";

export const getRepoPulls = async (
  orgId: string,
  repoId: string,
): Promise<ApiResponse<PullRequest[]>> => {
  try {
    const res = await axiosInstance.get(API_ORG_REPO_PULLS(orgId, repoId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getRepoScans = async (
  orgId: string,
  repoId: string,
  limit = 20,
): Promise<ApiResponse<RepoScan[]>> => {
  try {
    const res = await axiosInstance.get(API_ORG_REPO_SCANS(orgId, repoId), {
      params: { limit },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getRepoBranches = async (
  orgId: string,
  repoId: string,
  options?: { search?: string; signal?: AbortSignal },
): Promise<ApiResponse<RepoBranches>> => {
  try {
    const res = await axiosInstance.get(API_ORG_REPO_BRANCHES(orgId, repoId), {
      params: options?.search ? { search: options.search } : undefined,
      signal: options?.signal,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Re-scans every open PR of the repo (Admin).
export const rescanRepo = async (
  orgId: string,
  repoId: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.post(API_PULL_RESCAN(orgId, repoId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getScanConfig = async (
  orgId: string,
  repoId: string,
): Promise<ApiResponse<ScanConfig>> => {
  try {
    const res = await axiosInstance.get(API_REPO_SCAN_CONFIG(orgId, repoId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateScanConfig = async (
  orgId: string,
  repoId: string,
  input: UpdateScanConfigInput,
): Promise<ApiResponse<ScanConfig>> => {
  try {
    const res = await axiosInstance.put(
      API_REPO_SCAN_CONFIG(orgId, repoId),
      input,
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getOrgRepositories = async (
  orgId: string,
): Promise<ApiResponse<OrgRepository[]>> => {
  try {
    const res = await axiosInstance.get(API_CONNECT_REPOS(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getRepositories = async (): Promise<ApiResponse<Repository[]>> => {
  try {
    const res = await axiosInstance.get(API_REPOS);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getRepositoryDetail = async (
  id: string,
): Promise<ApiResponse<Repository>> => {
  try {
    const res = await axiosInstance.get(API_REPO_DETAIL(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getRepositoryScans = async (
  id: string,
): Promise<ApiResponse<ScanHistoryEntry[]>> => {
  try {
    const res = await axiosInstance.get(API_REPO_SCANS(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const connectRepository = async (
  input: ConnectRepositoryInput,
): Promise<ApiResponse<Repository>> => {
  try {
    const res = await axiosInstance.post(API_REPOS, input);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const disconnectRepository = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const res = await axiosInstance.delete(API_REPO_DETAIL(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const rescanRepository = async (
  id: string,
): Promise<ApiResponse<Repository>> => {
  try {
    const res = await axiosInstance.post(API_REPO_RESCAN(id));
    return res.data;
  } catch (error) {
    throw error;
  }
};
