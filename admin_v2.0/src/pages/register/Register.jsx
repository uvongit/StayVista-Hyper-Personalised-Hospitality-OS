import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../../api/services.js";

const INITIAL_FORM = {
  username: "",
  email: "",
  password: "",
  phone: "",
  country: "",
  city: "",
};

const Register = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser({ ...formData, isAdmin });
      setSuccess("Account created successfully. You can now log in.");
      setFormData(INITIAL_FORM);
      setIsAdmin(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/20 dark:via-dark-background dark:to-dark-background">
      <div className="w-full max-w-2xl space-y-8 rounded-2xl border border-border/60 bg-surface/95 p-10 shadow-soft backdrop-blur dark:border-dark-border dark:bg-dark-surface/95">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            Create account
          </h1>
          <p className="text-sm text-text-muted dark:text-dark-text-muted">
            Set up access for yourself or a teammate.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Username
              </span>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="john.doe"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Email
              </span>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="john@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Password
              </span>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="••••••••"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Phone
              </span>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Country
              </span>
              <input
                id="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="India"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                City
              </span>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
                placeholder="Mumbai"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 text-sm font-medium text-text-secondary dark:border-dark-border/60 dark:bg-dark-background/60 dark:text-dark-text-secondary">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(event) => setIsAdmin(event.target.checked)}
              className="h-4 w-4"
            />
            <span>Grant admin access</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-text-muted dark:text-dark-text-muted">
          <span>Already have an account?</span>
          <Link to="/login" className="font-medium text-primary transition hover:text-primary-dark">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
