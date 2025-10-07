import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../../api/services";
import "./register.scss";

const initialState = {
  username: "",
  email: "",
  password: "",
  phone: "",
  country: "",
  city: "",
};

const Register = () => {
  const [formData, setFormData] = useState(initialState);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser({ ...formData, isAdmin });
      setSuccess("Account created successfully. You can now log in.");
      setFormData(initialState);
      setIsAdmin(false);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="rContainer">
        <h2>Create Account</h2>
        <p className="subtitle">Set up access for yourself or a teammate</p>
        <form onSubmit={handleSubmit}>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            id="phone"
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            id="country"
            type="text"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
          />
          <input
            id="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
          />
          <label className="checkboxRow">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <span>Grant admin access</span>
          </label>
          <button type="submit" disabled={loading} className="primary-button">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {error && <div className="errorMessage">{error}</div>}
        {success && <div className="successMessage">{success}</div>}
        <div className="footer">
          <span>Already have an account?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
