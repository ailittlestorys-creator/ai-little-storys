import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { handleRazorpayWebhook } from "./controllers/webhookController.js";

import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import studentCourseRoutes from "./routes/studentCourseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

// 1. Security
app.use(helmet());

// 2. CORS

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-little-storys.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. Rate Limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

// 4. Razorpay Webhook - MUST BE BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);

// 5. Normal Body Parser
app.use(express.json({ limit: "1mb" }));

app.set("trust proxy", 1);

// 6. Cookie Parser
app.use(cookieParser());

// 7. API Routes
app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/cloudinary", cloudinaryRoutes);

app.use("/api/content", contentRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/student/courses", studentCourseRoutes);

app.use("/api/courses", courseRoutes);

// 8. Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Course Platform API Running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Little Stories API is running",
  });
});

export default app;
