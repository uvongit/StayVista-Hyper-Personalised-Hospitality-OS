import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.js";
import { login } from "../../api/services.js";
import { consumeSessionMessage } from "../../utils/session.js";
import { extractApiErrorMessage } from "../../utils/error.js";

const Login = () => {
  const [credentials, setCredentials] = useState({ identifier: "", password: "" });
  const [sessionMessage] = useState(() => consumeSessionMessage());
  const { loading, error, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch({ type: "LOGIN_START" });
    try {
      const trimmed = credentials.identifier.trim();
      let payload;

      if (trimmed.includes("@")) {
        payload = { email: trimmed, password: credentials.password };
      } else if (/\d/.test(trimmed)) {
        const sanitizedPhone = trimmed.replace(/[\s()-]/g, "").replace(/^(\+)?0+(?=\d)/, "$1");
        payload = { phone: sanitizedPhone, password: credentials.password };
      } else {
        payload = { username: trimmed, password: credentials.password };
      }

      const data = await login(payload);

      const user = data?.user ?? null;
      const accessToken = data?.accessToken ?? null;

      if (!user || !accessToken) {
        throw new Error("Login response is missing authentication details.");
      }

      if (!user.superAdmin) {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: { message: "Only superadmins may access the admin panel." },
        });
        return;
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, accessToken } });
      navigate("/");
    } catch (err) {
      const message = extractApiErrorMessage(err, "Login failed");
      setCredentials((prev) => ({ ...prev, password: "" }));
      dispatch({
        type: "LOGIN_FAILURE",
        payload: { message },
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/20 dark:via-dark-background dark:to-dark-background">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/60 bg-surface/95 p-10 shadow-soft backdrop-blur dark:border-dark-border dark:bg-dark-surface/95">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">Welcome back</h1>
          <p className="text-sm text-text-muted dark:text-dark-text-muted">
            Enter your credentials to access the StayVista admin dashboard.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {sessionMessage && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
              {sessionMessage}
            </div>
          )}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Username, email, or phone
              </span>
              <input
                id="identifier"
                type="text"
                value={credentials.identifier}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="super.admin, admin@example.com, or +1 415 555 0123"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Password
              </span>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="••••••••"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        {error?.message && (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
