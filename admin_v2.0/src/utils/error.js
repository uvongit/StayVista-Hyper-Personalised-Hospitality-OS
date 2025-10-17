export const extractApiErrorMessage = (error, fallback = "Request failed") => {
  if (!error) {
    return fallback;
  }

  const response = error.response ?? error;
  const data = response?.data ?? error.data ?? null;

  if (data) {
    if (typeof data === "string") {
      return data;
    }

    if (Array.isArray(data)) {
      const joined = data.filter(Boolean).join(". ");
      if (joined) return joined;
    }

    if (typeof data === "object") {
      if (data.message && typeof data.message === "string") {
        return data.message;
      }
      if (data.error && typeof data.error === "string") {
        return data.error;
      }
      if (Array.isArray(data.errors)) {
        const aggregated = data.errors
          .map((item) => {
            if (!item) return null;
            if (typeof item === "string") return item;
            if (typeof item === "object") {
              return item.message || item.detail || null;
            }
            return null;
          })
          .filter(Boolean)
          .join(". ");
        if (aggregated) {
          return aggregated;
        }
      }
    }
  }

  if (response?.statusText) {
    return response.statusText;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
};

export const extractApiError = (error, fallback = "Request failed") => {
  const message = extractApiErrorMessage(error, fallback);
  const response = error?.response ?? error;

  return {
    message,
    status: response?.status ?? error?.status ?? null,
    data: response?.data ?? error?.data ?? null,
    raw: error,
  };
};
