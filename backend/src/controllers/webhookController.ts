import { Request, Response } from "express";
import crypto from "crypto";

import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import WebhookEvent from "../models/WebhookEvent.js";

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing");
      return res.sendStatus(500);
    }

    // Razorpay signature must be verified against raw bytes
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).send("Raw request body required");
    }

    const signature = req.headers["x-razorpay-signature"];

    if (typeof signature !== "string") {
      return res.status(400).send("Missing webhook signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return res.status(400).send("Invalid webhook signature");
    }

    // Parse only after signature verification
    const payload = JSON.parse(req.body.toString("utf8"));

    const event = payload.event;

    const paymentEntity = payload.payload?.payment?.entity;

    if (
      !["payment.captured", "payment.failed"].includes(event) ||
      !paymentEntity
    ) {
      return res.status(200).json({
        received: true,
        ignored: true,
      });
    }

    const {
      id: paymentId,
      order_id: orderId,
      amount,
      currency,
      status,
    } = paymentEntity;

    const payment = await Payment.findOne({
      razorpayOrderId: orderId,
    });

    if (!payment) {
      console.error("Webhook received for unknown order:", orderId);

      return res.status(200).json({
        received: true,
        ignored: true,
      });
    }

    // Validate payment details against our database
    if (payment.amount !== amount || payment.currency !== currency) {
      console.error("Webhook payment amount/currency mismatch:", orderId);

      return res.status(200).json({
        received: true,
        ignored: true,
      });
    }

    const razorpayEventId = req.headers["x-razorpay-event-id"];

    const eventId =
      typeof razorpayEventId === "string" && razorpayEventId
        ? razorpayEventId
        : crypto.createHash("sha256").update(req.body).digest("hex");

    const existingEvent = await WebhookEvent.findOne({ eventId });

    if (existingEvent) {
      return res.status(200).json({
        received: true,
        duplicate: true,
      });
    }

    if (event === "payment.captured" && status === "captured") {
      // Activate enrollment only for captured payments
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

      payment.razorpayPaymentId = paymentId;
      payment.status = "paid";
      await payment.save();
    } else if (event === "payment.failed") {
      // Never overwrite a successful payment with a late failure event
      if (payment.status !== "paid") {
        payment.status = "failed";
        await payment.save();
      }
    }

    await WebhookEvent.create({
      eventId,
      event,
    });

    return res.status(200).json({
      received: true,
      success: true,
    });
  } catch (error) {
    // Duplicate insert can happen if Razorpay delivers the same
    // event concurrently. Enrollment upsert is also idempotent.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(200).json({
        received: true,
        duplicate: true,
      });
    }

    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
