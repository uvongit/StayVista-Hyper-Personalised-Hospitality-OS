import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./login.css";
import { login as loginRequest } from "../../api/auth";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [formError, setFormError] = useState(null);

  const { loading, error, dispatch } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    dispatch({ type: "LOGIN_START" });
    try {
      const trimmedPayload = {
        username: credentials.username.trim(),
        password: credentials.password,
      };
      const response = await loginRequest(trimmedPayload);

      const {
        details: responseDetails = {},
        token,
        accessToken,
        access_token,
        jwtToken,
      } = response ?? {};

      const baseDetails =
        responseDetails && typeof responseDetails === "object" && Object.keys(responseDetails).length > 0
          ? responseDetails
          : (response ?? {});

      const resolvedToken = token || accessToken || access_token || jwtToken;
      const userPayload = {
        ...baseDetails,
        ...(resolvedToken ? { token: resolvedToken } : {}),
      };

      dispatch({ type: "LOGIN_SUCCESS", payload: userPayload });
      navigate("/");
    } catch (err) {
      const payload = err?.data ?? { message: "Login failed" };
      dispatch({ type: "LOGIN_FAILURE", payload });
      setFormError(payload.message ?? "Login failed");
    }
  };

  const displayError = useMemo(() => {
    if (formError) return formError;
    if (!error) return null;
    if (typeof error === "string") return error;
    return error.message;
  }, [error, formError]);

  return (
    <section className="auth auth--login">
      <div className="auth__background" aria-hidden="true" />
      <div className="auth__panel">
        <div className="auth__header">
          <span className="badge">Welcome back</span>
          <h1 className="auth__title">Sign in to StayVista</h1>
          <p className="auth__subtitle">
            Access curated villas, signature hospitality, and insider itineraries tailored to the way you travel.
          </p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {displayError && <p className="auth__error" role="alert">{displayError}</p>}

          <button type="submit" className="btn-primary auth__submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth__switch">
          New to StayVista? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
