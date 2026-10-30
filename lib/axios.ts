import axios from "axios";

import { API_ERROR_MESSAGE } from "@/const/api.constant";

const axiosInstance = axios.create({
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiErrors = error.response?.data?.errors as
      { field: string; message: string }[] | undefined;
    const code = apiErrors?.[0]?.message;
    // Readable copy for app-wide codes; the raw code stays in response.data
    // for callers that branch on it.
    error.message =
      (code && Object.hasOwn(API_ERROR_MESSAGE, code)
        ? API_ERROR_MESSAGE[code]
        : code) ?? error.message;
    return Promise.reject(error);
  },
);

export default axiosInstance;
