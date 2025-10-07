import apiClient from "./client";

export const login = (credentials) =>
  apiClient.post("/auth/login", credentials).then((response) => response.data);

export const register = (payload) =>
  apiClient.post("/auth/register", payload).then((response) => response.data);
