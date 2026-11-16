import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Props {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
}

export default function BuyNowButton({ courseId, courseSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [paymentAlertTitle, setPaymentAlertTitle] = useState("");
  const [paymentAlertMessage, setPaymentAlertMessage] = useState("");

  const paymentVerifiedRef = useRef(false);
  const paymentFailedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading: authLoading } = useAuth();

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (authLoading) {
      toast("Please wait...");
      return;
    }

    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    try {
      setLoading(true);

      const loaded = await loadRazorpay();

      if (!loaded) {
        toast.error("Unable to load payment gateway");
        return;
      }

      const orderResponse = await api.post("/payments/create-order", {
        courseId,
      });

      const { orderId, amount, currency, keyId } = orderResponse.data;

      paymentVerifiedRef.current = false;
      paymentFailedRef.current = false;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "AI Little Stories",
        description: "Course Purchase",
        order_id: orderId,

        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await api.post("/payments/verify", response);

            if (verifyResponse.data.success) {
              paymentVerifiedRef.current = true;
              setShowSuccessAlert(true);
            } else {
              toast.error(
                "Payment verification is pending. Please check your course access.",
              );
            }
          } catch (error) {
            console.error("Verification error:", error);

            toast.error(
              "Payment received, but verification is pending. Please contact support if access is not activated.",
            );
          }
        },

        modal: {
          ondismiss: () => {
            if (!paymentVerifiedRef.current && !paymentFailedRef.current) {
              setPaymentAlertTitle("Payment Window Closed");

              setPaymentAlertMessage(
                "You closed the payment window. If money was deducted, please wait for payment verification before trying again.",
              );

              setShowPaymentAlert(true);
            }
          },
        },

        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        paymentFailedRef.current = true;

        setPaymentAlertTitle("Payment Failed");

        setPaymentAlertMessage(
          response.error?.description ||
            "Your payment could not be completed. If money was deducted, please contact us.",
        );

        setShowPaymentAlert(true);

        console.error("Payment failed:", response.error);
      });

      razorpay.open();
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Unable to start payment");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate("/login", {
      state: {
        from: location.pathname,
      },
    });
  };

  const handleRegister = () => {
    navigate("/register", {
      state: {
        from: location.pathname,
      },
    });
  };

  return (
    <>
      <button
        className="buy-course-button"
        onClick={handlePurchase}
        disabled={loading || authLoading}
      >
        {authLoading ? "Checking..." : loading ? "Please wait..." : "Buy Now"}
      </button>

      {/* Login / Register Alert */}

      {showLoginAlert && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowLoginAlert(false)}
        >
          <div
            className="login-alert-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-alert-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="login-alert-icon">!</div>

            <h2 id="login-alert-title">Account Required</h2>

            <p>
              You need an account to purchase this course. Please login or
              create a new account to continue.
            </p>

            <div className="login-alert-actions">
              <button
                className="alert-cancel-btn"
                onClick={() => setShowLoginAlert(false)}
              >
                Cancel
              </button>

              <button className="alert-register-btn" onClick={handleRegister}>
                Register Now
              </button>

              <button className="alert-login-btn" onClick={handleLogin}>
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed / Window Closed Alert */}

      {showPaymentAlert && (
        <div
          className="login-alert-overlay"
          onClick={() => setShowPaymentAlert(false)}
        >
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-alert-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-cancel-icon">×</div>

            <h2 id="payment-alert-title">{paymentAlertTitle}</h2>

            <p>{paymentAlertMessage}</p>

            <button
              className="payment-retry-button"
              onClick={() => setShowPaymentAlert(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Alert */}

      {showSuccessAlert && (
        <div className="login-alert-overlay">
          <div
            className="login-alert-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
          >
            <div className="payment-success-icon">✓</div>

            <h2 id="payment-success-title">Payment Successful!</h2>

            <p>
              Congratulations! Your payment is verified and your course access
              has been activated.
            </p>

            <button
              className="payment-success-button"
              onClick={() =>
                navigate(`/learn/courses/${courseSlug}`, {
                  replace: true,
                })
              }
            >
              Start Learning
            </button>
          </div>
        </div>
      )}
    </>
  );
}
