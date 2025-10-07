import axios from "axios";
import { API_BASE_URL } from "../config";
import { handleSessionExpiry } from "../utils/session";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const scope = storedUser?.superAdmin
      ? "super"
      : storedUser?.isAdmin
      ? "admin"
      : "member";
    config.headers["X-Session-Scope"] = scope;

    const token =
      storedUser?.token ||
      storedUser?.accessToken ||
      storedUser?.access_token ||
      storedUser?.jwtToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    config.headers["X-Session-Scope"] = "member";
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error?.response ?? error;
    if (response?.status === 401 || response?.status === 403) {
      handleSessionExpiry();
    }
    return Promise.reject(response);
  }
);

export default apiClient;
