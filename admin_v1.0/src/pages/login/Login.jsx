import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { login } from "../../api/services";
// import { AuthContext } from "../../context/AuthContext";
import "./login.scss";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: undefined,
    password: undefined,
  });

  const { loading, error, dispatch } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    dispatch({ type: "LOGIN_START" });
    try {
      const data = await login(credentials);
      const userDetails = data?.details;
      if (userDetails?.superAdmin) {
        dispatch({ type: "LOGIN_SUCCESS", payload: userDetails });
        navigate("/");
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: { message: "Only superadmins may access the admin panel." },
        });
      }
    } catch (err) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: err?.response?.data || { message: "Login failed" },
      });
    }
  };

  return (
    <div className="login">
      <div className="lContainer">
        <h2>Welcome back</h2>
        <p className="subtitle">Enter your credentials to access the dashboard</p>
        <input
          type="text"
          placeholder="username"
          id="username"
          onChange={handleChange}
          className="lInput"
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          onChange={handleChange}
          className="lInput"
        />
        <button
          disabled={loading}
          onClick={handleClick}
          className="lButton primary-button"
        >
          Login
        </button>
        {error && <span>{error.message}</span>}
        <div className="registerLink">
          <span>Don&apos;t have an account?</span>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
