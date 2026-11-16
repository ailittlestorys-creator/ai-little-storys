import { Router } from "express";

import {
  register,
  verifyEmail,
  resendVerificationOtp,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Registration
router.post("/register", register);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendVerificationOtp);

// Login / Logout
router.post("/login", login);
router.post("/logout", logout);

// Current user
router.get("/me", protect, getMe);

export default router;
