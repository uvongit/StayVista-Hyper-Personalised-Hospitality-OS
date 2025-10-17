import axios from "axios";
import { clearAuth, getAuth, setAuth } from "../utils/authStorage.js";
import { handleSessionExpiry } from "../utils/session.js";
import { extractApiErrorMessage } from "../utils/error.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshAuth = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

let refreshPromise = null;

const getRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAuth()
      .then((data) => {
        const user = data?.user ?? null;
        const accessToken = data?.accessToken ?? null;

        if (!user || !accessToken) {
          throw new Error("Refresh endpoint did not return user or accessToken");
        }

        setAuth({ user, accessToken });
        apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
        return { user, accessToken };
      })
      .catch((error) => {
        clearAuth();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use((config) => {
  try {
    const storedAuth = getAuth();
    if (storedAuth?.accessToken) {
      config.headers.Authorization = `Bearer ${storedAuth.accessToken}`;
    } else {
      delete config.headers.Authorization;
    }
  } catch (err) {
    console.error("Failed to attach admin authorization header", err);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error?.response;
    const originalRequest = error?.config ?? {};
    const status = response?.status;

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { accessToken } = await getRefreshPromise();
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        const message = extractApiErrorMessage(refreshError, null);
        handleSessionExpiry(message);
        return Promise.reject(refreshError?.response ?? refreshError);
      }
    }

    if (status === 401 || status === 403) {
      const message = extractApiErrorMessage(response, null);
      handleSessionExpiry(message);
    }

    return Promise.reject(response ?? error);
  }
);

export default apiClient;
