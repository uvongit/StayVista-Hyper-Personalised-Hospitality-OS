import axios from "axios";
import { handleSessionExpiry } from "../utils/session";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const scope = storedUser?.superAdmin ? "super" : storedUser?.isAdmin ? "admin" : "member";
    config.headers["X-Session-Scope"] = scope;
  } catch (err) {
    config.headers["X-Session-Scope"] = "admin";
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
