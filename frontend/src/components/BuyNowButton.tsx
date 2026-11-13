import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

interface Props {
  courseId: string;
  courseTitle: string;
}

export default function BuyNowButton({ courseId, courseTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
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

      const { orderId, amount, currency, keyId, courseName } =
        orderResponse.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "AI Little Stories",
        description: courseName || courseTitle,
        order_id: orderId,

        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await api.post("/payments/verify", response);

            if (verifyResponse.data.success) {
              toast.success("Payment successful! Course access activated.");

              navigate("/dashboard");
            }
          } catch (error) {
            console.error("Verification error:", error);

            toast.error(
              "Payment received, but verification is pending. Contact support if access is not activated.",
            );
          }
        },

        modal: {
          ondismiss: () => {
            toast("Payment window closed");
          },
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        toast.error(response.error.description || "Payment failed");
      });

      razorpay.open();
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Unable to start payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="buy-course-button"
      onClick={handlePurchase}
      disabled={loading}
    >
      {loading ? "Please wait..." : "Buy Now"}
    </button>
  );
}
