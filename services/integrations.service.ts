import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  GitLabIntegration,
  IntegrationSource,
  RepoCandidate,
  VerifyGitLabTokenInput,
} from "@/lib/types/integration.types";
import {
  API_INTEGRATION_CANDIDATES,
  API_INTEGRATIONS_GITLAB,
  API_ORG,
} from "@/routes";

export const createOrganization = async (payload: {
  name: string;
  organizationId?: string;
}): Promise<{ id: string; name: string; slug: string }> => {
  try {
    const { name, organizationId } = payload;
    let res;
    if (organizationId) {
      res = await axiosInstance.patch(`${API_ORG}/${organizationId}`, {
        name,
      });
    } else {
      res = await axiosInstance.post(API_ORG, { name });
    }
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateOrganization = async (payload: {
  id: string;
  name: string;
}): Promise<ApiResponse<{ id: string }>> => {
  try {
    const res = await axiosInstance.patch(`${API_ORG}/${payload.id}`, {
      name: payload.name,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const verifyGitLabToken = async (
  orgId: string,
  input: VerifyGitLabTokenInput,
): Promise<ApiResponse<GitLabIntegration>> => {
  try {
    const res = await axiosInstance.post(API_INTEGRATIONS_GITLAB(orgId), input);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getIntegrationCandidates = async (
  orgId: string,
  source: IntegrationSource,
): Promise<ApiResponse<RepoCandidate[]>> => {
  try {
    const res = await axiosInstance.get(
      API_INTEGRATION_CANDIDATES(orgId, source),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};
