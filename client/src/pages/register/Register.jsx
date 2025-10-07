import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerRequest } from "../../api/auth";
import "./register.css";

const initialState = {
  username: "",
  email: "",
  city: "",
  country: "",
  phone: "",
  password: "",
};

const Register = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      await registerRequest(payload);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      const message = err?.data?.message ?? "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth auth--register">
      <div className="auth__background" aria-hidden="true" />
      <div className="auth__panel">
        <div className="auth__header">
          <span className="badge">Create account</span>
          <h1 className="auth__title">Join StayVista</h1>
          <p className="auth__subtitle">Set up your profile to unlock curated stays and member-only rates.</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="auth__field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              placeholder="San Francisco"
              value={form.city}
              onChange={handleChange}
              required
              autoComplete="address-level2"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              placeholder="United States"
              value={form.country}
              onChange={handleChange}
              required
              autoComplete="country-name"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1 415 555 1234"
              value={form.phone}
              onChange={handleChange}
              required
              autoComplete="tel"
              pattern="^[0-9+()\\s-]{7,20}$"
            />
          </div>
          <div className="auth__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary auth__submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
};

export default Register;
