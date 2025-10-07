const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("REACT_APP_API_BASE_URL is not defined in the environment variables.");
}

export { API_BASE_URL };
