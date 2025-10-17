export const AUTH_STORAGE_KEY = "auth";

const STORAGE_KEY = AUTH_STORAGE_KEY;

const emptyAuth = () => ({ user: null, accessToken: null });

const emitAuthEvent = (detail) => {
  try {
    window.dispatchEvent(new CustomEvent("auth:updated", { detail }));
  } catch (err) {
    console.error("Failed to emit auth update event", err);
  }
};

export const getAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAuth();
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      accessToken: parsed?.accessToken ?? null,
    };
  } catch (err) {
    console.error("Failed to read auth storage", err);
    return emptyAuth();
  }
};

export const setAuth = (auth, options = {}) => {
  const { emit = true } = options;
  if (!auth || !auth.user || !auth.accessToken) {
    clearAuth({ emit });
    return;
  }

  try {
    const payload = { user: auth.user, accessToken: auth.accessToken };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (emit) {
      emitAuthEvent(payload);
    }
  } catch (err) {
    console.error("Failed to persist auth storage", err);
  }
};

export const clearAuth = (options = {}) => {
  const { emit = true } = options;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (emit) {
      emitAuthEvent(emptyAuth());
    }
  } catch (err) {
    console.error("Failed to clear auth storage", err);
  }
};
