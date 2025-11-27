import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RootAdminRegistration.module.css";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { rootAdminAPI } from "../../services/api";

const RootAdminRegistration = () => {
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // registration loader
  const [checking, setChecking] = useState(true); // check if root admin exists
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check if root admin exists
  useEffect(() => {
    const checkRootAdmin = async () => {
      try {
        const data = await rootAdminAPI.checkExists();

        if (data.exists) {
          navigate("/login"); // root admin exists → redirect to login
        } else {
          setChecking(false); // allow registration form
        }
      } catch (error) {
        console.error("Error checking root admin:", error);
        navigate("/login"); // fallback
      }
    };

    checkRootAdmin();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await rootAdminAPI.register({ username, password, mobileNumber });
      alert(data.message || "Root admin registered successfully!");
      navigate("/login"); // redirect after successful registration
    } catch (error) {
      console.error("Error registering root admin:", error);
      setError(error.message || "Error registering root admin");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={styles.container}>
        <Navbar />
        <div className={styles.parent}>
          <h2 className={styles.infoText}>Checking system status...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.parent}>
        <div className={styles.signupBox}>
          <h2 className={styles.title}>Root Admin Registration</h2>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Registering..." : "Register Root Admin"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RootAdminRegistration;
