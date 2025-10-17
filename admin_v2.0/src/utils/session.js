import { clearAuth } from "./authStorage.js";

let hasRedirected = false;

const SESSION_MESSAGE_KEY = "stayvista-admin:sessionMessage";
const DEFAULT_EXPIRY_MESSAGE = "Your admin session has ended. Please sign in again.";

const storeSessionMessage = (message) => {
  const normalizedMessage =
    typeof message === "string" && message.trim().length > 0 ? message.trim() : DEFAULT_EXPIRY_MESSAGE;

  try {
    sessionStorage.setItem(SESSION_MESSAGE_KEY, normalizedMessage);
  } catch (err) {
    console.error("Failed to persist admin session message", err);
  }
};

export const consumeSessionMessage = () => {
  try {
    const message = sessionStorage.getItem(SESSION_MESSAGE_KEY);
    if (message) {
      sessionStorage.removeItem(SESSION_MESSAGE_KEY);
      return message;
    }
  } catch (err) {
    console.error("Failed to read admin session message", err);
  }
  return null;
};

export const handleSessionExpiry = (message) => {
  if (hasRedirected) return;
  hasRedirected = true;

  storeSessionMessage(message);

  clearAuth();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  } else {
    window.location.reload();
  }
};
