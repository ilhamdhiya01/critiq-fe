import axios from "axios";

const axiosInstance = axios.create({
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiErrors = error.response?.data?.errors as
      { field: string; message: string }[] | undefined;
    error.message = apiErrors?.[0]?.message ?? error.message;
    return Promise.reject(error);
  },
);

export default axiosInstance;
