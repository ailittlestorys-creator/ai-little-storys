import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState("");

  const from = location.state?.from;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowError(false);
    setShowSuccess(false);

    try {
      setLoading(true);

      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(response.data.message);
      setShowSuccess(true);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Unable to send reset link. Please try again.",
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/login", {
      replace: true,
      state: { from },
    });
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Forgot Password?</h2>

        <p>
          Enter your registered email address. We will send you a password reset
          link.
        </p>

        <label>Email Address</label>

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p>
          Remember your password?{" "}
          <Link to="/login" state={{ from }}>
            Login
          </Link>
        </p>
      </form>

      {showSuccess && (
        <div className="login-alert-overlay">
          <div className="login-alert-box" role="alertdialog" aria-modal="true">
            <div className="payment-success-icon">✓</div>

            <h2>Password Reset Link Sent</h2>

            <p>{message}</p>

            <button
              type="button"
              className="payment-success-button"
              onClick={handleContinue}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {showError && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowError(false)}
        >
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-error-icon">!</div>

            <h2>Request Failed</h2>

            <p>{message}</p>

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
    </div>
  );
}

export default ForgotPassword;
