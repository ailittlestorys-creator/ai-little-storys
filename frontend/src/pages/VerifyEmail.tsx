import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";
import "../styles/verify-email.css";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [countdown, setCountdown] = useState(location.state?.email ? 60 : 0);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const from = location.state?.from;

  const redirectPath =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/dashboard";

  const [verifiedUser, setVerifiedUser] = useState<{
    role: string;
  } | null>(null);

  // Resend OTP countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowError(false);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setShowError(true);
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage("Please enter the valid 6-digit OTP.");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/verify-email", {
        email: email.trim(),
        otp,
      });

      // Backend sets the authentication cookie after verification.
      const currentUser = await refreshUser();

      if (!currentUser) {
        setErrorMessage(
          "Email verification succeeded, but your login session could not be established. Please login.",
        );
        setShowError(true);
        return;
      }

      setVerifiedUser({
        role: currentUser.role,
      });

      setShowSuccess(true);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          "OTP verification failed. Please try again.",
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setShowError(true);
      return;
    }

    try {
      setResendLoading(true);
      setShowError(false);

      await api.post("/auth/resend-otp", {
        email: email.trim(),
      });

      setOtp("");
      setCountdown(60);

      toast.success("A new OTP has been sent to your email.");
    } catch (error: any) {
      const remainingSeconds = error.response?.data?.remainingSeconds;

      if (remainingSeconds) {
        setCountdown(remainingSeconds);
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to resend OTP. Please try again.",
      );
      setShowError(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleContinue = () => {
    if (verifiedUser?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="auth-container verify-email-container">
      <form className="auth-card verify-email-card" onSubmit={handleVerify}>
        <div className="verify-email-icon">✉</div>

        <h2>Verify Your Email</h2>

        <p>
          We have sent a 6-digit verification code to your email address. Enter
          the code below to activate your account.
        </p>

        <div className="verify-email-address">
          <label>Email Address</label>
          <p>{email}</p>
        </div>

        <label>Verification Code</label>
        <input
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="resend-otp-section">
          {countdown > 0 ? (
            <p>
              Resend OTP in <strong>{countdown}s</strong>
            </p>
          ) : (
            <button
              type="button"
              className="resend-otp-button"
              onClick={handleResendOtp}
              disabled={resendLoading || loading}
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>
      </form>

      {/* Verification Error Alert */}
      {showError && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowError(false)}
        >
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="verify-error-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-error-icon">!</div>

            <h2 id="verify-error-title">Verification Error</h2>

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

      {/* Verification Success Alert */}
      {showSuccess && (
        <div className="login-alert-overlay">
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="verify-success-title"
          >
            <div className="payment-success-icon">✓</div>

            <h2 id="verify-success-title">Email Verified Successfully!</h2>

            <p>
              Your email address has been verified and your AI Little Stories
              account is ready.
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

export default VerifyEmail;
