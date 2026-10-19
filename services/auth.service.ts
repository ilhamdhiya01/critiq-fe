import axiosInstance from "@/lib/axios";
import { ApiResponse } from "@/lib/types/api.types";
import { UserSession } from "@/lib/types/auth.types";
import { API_AUTH_LOGOUT, API_AUTH_ME, API_OAUTH_LOGIN } from "@/routes";

export const hanldeOAuthLogin = async (provider: "github" | "gitlab") => {
  try {
    const response = await axiosInstance.get(API_OAUTH_LOGIN(provider));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUser = async (): Promise<ApiResponse<UserSession>> => {
  try {
    const response = await axiosInstance.get(API_AUTH_ME);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Always succeeds, even without a session; the BE clears the cookie.
export const logout = async (): Promise<ApiResponse<{ loggedOut: true }>> => {
  try {
    const response = await axiosInstance.post(API_AUTH_LOGOUT);
    return response.data;
  } catch (error) {
    throw error;
  }
};
