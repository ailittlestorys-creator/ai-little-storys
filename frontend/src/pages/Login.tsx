import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const from = location.state?.from;

  const redirectPath =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/dashboard";

  const [loggedInUser, setLoggedInUser] = useState<{
    role: string;
  } | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowError(false);
    setShowSuccess(false);

    try {
      setLoading(true);

      await api.post("/auth/login", {
        email,
        password,
      });

      const currentUser = await refreshUser();

      if (!currentUser) {
        setErrorMessage(
          "Login succeeded, but session could not be established. Please check browser cookies.",
        );
        setShowError(true);
        return;
      }

      setLoggedInUser({
        role: currentUser.role,
      });

      setShowSuccess(true);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Invalid email or password",
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (loggedInUser?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>

        <p>Login to continue learning.</p>

        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <div className="forgot-password-link">
          <Link to="/forgot-password" state={{ from: redirectPath }}>
            Forgot Password?
          </Link>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <Link to="/register" state={{ from: redirectPath }}>
            Register
          </Link>
        </p>
      </form>

      {/* Login Failed Alert */}
      {showError && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowError(false)}
        >
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-error-icon">!</div>

            <h2 id="login-error-title">Login Failed</h2>

            <p>{errorMessage}</p>

            <button
              type="button"
              className="login-error-close"
              onClick={() => setShowError(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Login Successful Alert */}
      {showSuccess && (
        <div className="login-alert-overlay">
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-success-title"
          >
            <div className="payment-success-icon">✓</div>

            <h2 id="login-success-title">Login Successful!</h2>

            <p>
              Welcome back! You have successfully logged in to your account.
            </p>

            <button
              type="button"
              className="payment-success-button"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
