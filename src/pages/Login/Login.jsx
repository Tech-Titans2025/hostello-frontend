import { useState } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, getDashboardPath, clearSession } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Basic validation
    const trimmedUsername = username.trim();

    if (!trimmedUsername) return setError("Username is required.");
    if (!password) return setError("Password is required.");

    setError("");
    setLoading(true);

    try {
      const response = await login({ username: trimmedUsername, password });

      const redirectPath = response.dashboardPath || getDashboardPath(response.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      clearSession();
      if (err?.status === 401 || err?.status === 403) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <Navbar />

      <div className={styles.loginContainer}>
        <form className={styles.loginBox} onSubmit={handleLogin}>
          <h2 className={styles.loginTitle}>Login</h2>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <span className={styles.errorMsg}>{error}</span>}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.signupBtn}
              onClick={() => navigate("/root-register")}
            >
              Register Root Admin
            </button>
            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
