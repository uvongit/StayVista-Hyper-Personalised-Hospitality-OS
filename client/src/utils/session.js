let hasRedirected = false;

export const handleSessionExpiry = () => {
  if (hasRedirected) return;
  hasRedirected = true;

  try {
    localStorage.removeItem("user");
  } catch (err) {
    console.error("Failed to clear session cache", err);
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  } else {
    window.location.reload();
  }
};
