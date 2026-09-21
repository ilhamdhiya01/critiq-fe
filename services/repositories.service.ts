import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  ConnectRepositoryInput,
  Repository,
  ScanHistoryEntry,
} from "@/lib/types/repository.types";
import {
  API_REPO_DETAIL,
  API_REPO_RESCAN,
  API_REPO_SCANS,
  API_REPOS,
} from "@/routes";

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
