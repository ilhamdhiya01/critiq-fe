import axiosInstance from "@/lib/axios";
import { ApiResponse } from "@/lib/types/api.types";
import { MembershipWithOrg } from "@/lib/types/membership.type";
import { API_ME_ORG } from "@/routes";

export const getMembershipWithOrg = async (): Promise<
  ApiResponse<MembershipWithOrg[]>
> => {
  try {
    const res = await axiosInstance.get(API_ME_ORG);
    return res.data;
  } catch (error) {
    throw error;
  }
};
