import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import api from "../services/api";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const from = location.state?.from;

  const redirectPath =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/dashboard";

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowError(false);

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.requiresEmailVerification) {
        navigate("/verify-email", {
          state: {
            email: response.data.email || email.trim().toLowerCase(),
            from: redirectPath,
          },
        });
      } else {
        setErrorMessage("Unexpected server response. Please try again.");
        setShowError(true);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";

      // Existing unverified account: allow user to go to OTP page.
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email", {
          state: {
            email: email.trim().toLowerCase(),
            from: redirectPath,
          },
        });
        return;
      }

      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleRegister}>
        <h2>Create Account</h2>

        <p>Start your learning journey today.</p>

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          disabled={loading}
        />

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
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={72}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p>
          Already have an account?{" "}
          <Link to="/login" state={{ from: redirectPath }}>
            Login
          </Link>
        </p>
      </form>

      {/* Registration Error Alert */}
      {showError && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowError(false)}
        >
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="register-error-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-error-icon">!</div>

            <h2 id="register-error-title">Registration Failed</h2>

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
    </div>
  );
}

export default Register;
