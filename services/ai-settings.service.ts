import axiosInstance from "@/lib/axios";
import type {
  AiModelList,
  AiSettings,
  AiSettingsAdmin,
  AiTestResult,
  ListAiModelsInput,
  TestAiConnectionInput,
  UpdateAiSettingsInput,
} from "@/lib/types/ai-settings.types";
import type { ApiResponse } from "@/lib/types/api.types";
import {
  API_SETTINGS_AI,
  API_SETTINGS_AI_MODELS,
  API_SETTINGS_AI_TEST,
} from "@/routes";

export const getAiSettings = async (
  orgId: string,
): Promise<ApiResponse<AiSettings>> => {
  try {
    const res = await axiosInstance.get(API_SETTINGS_AI(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateAiSettings = async (
  orgId: string,
  input: UpdateAiSettingsInput,
): Promise<ApiResponse<AiSettingsAdmin>> => {
  try {
    const res = await axiosInstance.put(API_SETTINGS_AI(orgId), input);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const testAiConnection = async (
  orgId: string,
  input: TestAiConnectionInput,
): Promise<ApiResponse<AiTestResult>> => {
  try {
    const res = await axiosInstance.post(API_SETTINGS_AI_TEST(orgId), input);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// GET uses the stored key/baseUrl; POST previews a key or baseUrl that has
// not been saved yet.
export const listAiModels = async (
  orgId: string,
  input: ListAiModelsInput,
): Promise<ApiResponse<AiModelList>> => {
  try {
    const isPreview = input.apiKey !== undefined || input.baseUrl !== undefined;
    const res = isPreview
      ? await axiosInstance.post(API_SETTINGS_AI_MODELS(orgId), input)
      : await axiosInstance.get(API_SETTINGS_AI_MODELS(orgId), {
          params: { provider: input.provider },
        });
    return res.data;
  } catch (error) {
    throw error;
  }
};
