import axiosInstance from "@/lib/axios";
import { API_OAUTH_LOGIN } from "@/routes";

export const hanldeOAuthLogin = async (provider: "github" | "gitlab") => {
  try {
    const response = await axiosInstance.get(API_OAUTH_LOGIN(provider));
    return response.data;
  } catch (error) {
    throw error;
  }
};
