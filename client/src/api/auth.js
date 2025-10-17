import apiClient from "./client";

const sanitizePhone = (value = "") => value.replace(/[\s()-]/g, "").replace(/^(\+)?0+(?=\d)/, "$1");

const isLikelyPhone = (value = "") => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
};

export const login = ({ identifier, password, ...rest }) => {
  const trimmed = (identifier || rest?.username || rest?.email || rest?.phone || "").trim();
  let payload;

  if (trimmed.includes("@")) {
    payload = { email: trimmed.toLowerCase(), password };
  } else if (isLikelyPhone(trimmed)) {
    const sanitized = sanitizePhone(trimmed);
    payload = { phone: sanitized, password };
  } else {
    payload = { username: trimmed, password };
  }

  return apiClient.post("/auth/login", payload).then((response) => response.data);
};

export const register = (payload) =>
  apiClient.post("/auth/register", payload).then((response) => response.data);

export const logout = () =>
  apiClient.post("/auth/logout").then((response) => response.data);
