import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type { OrgRules, UpdateRuleTierInput } from "@/lib/types/rules.types";
import { API_ORG_RULES } from "@/routes";

export const getOrgRules = async (
  orgId: string,
): Promise<ApiResponse<OrgRules>> => {
  try {
    const res = await axiosInstance.get(API_ORG_RULES(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// One tier per call — the PATCH answers with the full RulesDto, same as GET.
export const updateRuleTier = async (
  orgId: string,
  input: UpdateRuleTierInput,
): Promise<ApiResponse<OrgRules>> => {
  try {
    const res = await axiosInstance.patch(API_ORG_RULES(orgId), input);
    return res.data;
  } catch (error) {
    throw error;
  }
};
