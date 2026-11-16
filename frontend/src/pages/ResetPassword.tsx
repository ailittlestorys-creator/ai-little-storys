import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowError(false);
    setShowSuccess(false);

    if (!token) {
      setMessage("Invalid password reset link.");
      setShowError(true);
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      setShowError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { password },
      );

      setMessage(response.data.message);
      setShowSuccess(true);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Unable to reset password. Please try again.",
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <p>Create a new password for your account.</p>

        <label>New Password</label>

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          maxLength={72}
          required
          disabled={loading}
        />

        <label>Confirm Password</label>

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          maxLength={72}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p>
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </form>

      {showSuccess && (
        <div className="login-alert-overlay">
          <div className="login-alert-box" role="alertdialog" aria-modal="true">
            <div className="payment-success-icon">✓</div>

            <h2>Password Reset Successful!</h2>

            <p>{message}</p>

            <button
              type="button"
              className="payment-success-button"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to Login
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

            <h2>Password Reset Failed</h2>

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

export default ResetPassword;
