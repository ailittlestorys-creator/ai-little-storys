import { Request, Response } from "express";
import crypto from "crypto";

import razorpay from "../config/razorpay.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "student" | "admin";
  };
}

// Create Razorpay Order
export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId,
      status: "active",
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You already own this course",
      });
    }

    if (!Number.isSafeInteger(course.price) || course.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    const amount = Math.round(course.price * 100);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `course_${Date.now()}`,
      notes: {
        userId,
        courseId: course._id.toString(),
      },
    });

    await Payment.create({
      userId,
      courseId: course._id,
      razorpayOrderId: order.id,
      amount,
      currency: "INR",
      status: "created",
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      courseName: course.title,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

// Verify payment and create lifetime enrollment
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are incomplete",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Course access already activated",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature);
    const expected = Buffer.from(expectedSignature);

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Confirm payment details directly with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or details do not match",
      });
    }

    // Idempotent enrollment creation
    await Enrollment.findOneAndUpdate(
      {
        userId: payment.userId,
        courseId: payment.courseId,
      },
      {
        $set: {
          status: "active",
          accessType: "lifetime",
        },
        $setOnInsert: {
          enrolledAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "paid";
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified. Lifetime access activated!",
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
