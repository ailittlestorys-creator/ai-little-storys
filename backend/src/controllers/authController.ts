import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  createHmac,
  createHash,
  randomInt,
  randomBytes,
  timingSafeEqual,
} from "crypto";

import User from "../models/User.js";
import { generateToken, setTokenCookie } from "../utils/generateToken.js";
import {
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

// OTP configuration
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Validation schemas
const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});

const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain 6 digits"),
});

const getOtpHash = (otp: string): string => {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET is not configured");
  }

  return createHmac("sha256", secret).update(otp).digest("hex");
};

const isOtpMatch = (enteredOtp: string, storedHash: string): boolean => {
  const enteredHash = Buffer.from(getOtpHash(enteredOtp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    enteredHash.length === savedHash.length &&
    timingSafeEqual(enteredHash, savedHash)
  );
};

const generateOtp = (): string => {
  return randomInt(100000, 1000000).toString();
};

// REGISTER
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid registration details",
        errors: result.error.flatten(),
      });
      return;
    }

    const { name, email, password } = result.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: existingUser.isEmailVerified
          ? "Email already registered"
          : "An account with this email already exists. Please verify your email or request a new OTP.",
        code: existingUser.isEmailVerified
          ? "EMAIL_ALREADY_REGISTERED"
          : "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      isEmailVerified: false,
      emailVerificationOtpHash: getOtpHash(otp),
      emailVerificationOtpExpires: new Date(Date.now() + OTP_EXPIRY_MS),
      emailVerificationOtpAttempts: 0,
      emailVerificationLastSentAt: new Date(),
    });

    try {
      await sendVerificationOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      console.error("OTP Email Error:", emailError);

      // Remove the pending account if email delivery fails.
      await User.deleteOne({ _id: user._id });

      res.status(503).json({
        success: false,
        message: "Unable to send verification email. Please try again.",
      });
      return;
    }

    // Do not create a login cookie before email verification.
    res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      message: "Verification OTP sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// VERIFY EMAIL OTP
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = verifyOtpSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email and 6-digit OTP",
      });
      return;
    }

    const { email, otp } = result.data;

    const user = await User.findOne({ email }).select(
      "+emailVerificationOtpHash +emailVerificationOtpExpires +emailVerificationOtpAttempts",
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Account not found. Please register again.",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(409).json({
        success: false,
        code: "EMAIL_ALREADY_VERIFIED",
        message: "Email is already verified. Please login.",
      });
      return;
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpires) {
      res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
      return;
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      user.emailVerificationOtpHash = undefined;
      user.emailVerificationOtpExpires = undefined;
      user.emailVerificationOtpAttempts = 0;
      await user.save();

      res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
      return;
    }

    if (user.emailVerificationOtpAttempts >= MAX_OTP_ATTEMPTS) {
      res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
      return;
    }

    const validOtp = isOtpMatch(otp, user.emailVerificationOtpHash);

    if (!validOtp) {
      user.emailVerificationOtpAttempts += 1;

      if (user.emailVerificationOtpAttempts >= MAX_OTP_ATTEMPTS) {
        user.emailVerificationOtpHash = undefined;
        user.emailVerificationOtpExpires = undefined;
      }

      await user.save();

      res.status(400).json({
        success: false,
        message: "Invalid OTP",
        remainingAttempts: Math.max(
          0,
          MAX_OTP_ATTEMPTS - user.emailVerificationOtpAttempts,
        ),
      });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.emailVerificationOtpAttempts = 0;

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify Email Error:", error);

    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

// RESEND VERIFICATION OTP
export const resendVerificationOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const emailSchema = z.object({
      email: z
        .string()
        .trim()
        .email()
        .transform((v) => v.toLowerCase()),
    });

    const result = emailSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
      return;
    }

    const { email } = result.data;

    const user = await User.findOne({ email }).select(
      "+emailVerificationLastSentAt",
    );

    // Avoid revealing whether an email is registered.
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If the account exists and needs verification, an OTP will be sent.",
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
      return;
    }

    const now = Date.now();

    if (
      user.emailVerificationLastSentAt &&
      now - user.emailVerificationLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS -
          (now - user.emailVerificationLastSentAt.getTime())) /
          1000,
      );

      res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        remainingSeconds,
      });
      return;
    }

    const otp = generateOtp();

    // Save new OTP before sending email.
    user.emailVerificationOtpHash = getOtpHash(otp);
    user.emailVerificationOtpExpires = new Date(now + OTP_EXPIRY_MS);
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationLastSentAt = new Date(now);

    await user.save();

    try {
      await sendVerificationOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      console.error("Resend OTP Email Error:", emailError);

      user.emailVerificationOtpHash = undefined;
      user.emailVerificationOtpExpires = undefined;
      user.emailVerificationLastSentAt = undefined;

      await user.save();

      res.status(503).json({
        success: false,
        message: "Unable to send OTP. Please try again later.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "A new verification OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
    });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const schema = z.object({
      email: z
        .string()
        .trim()
        .email()
        .transform((v) => v.toLowerCase()),
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
      return;
    }

    const { email } = result.data;

    const user = await User.findOne({
      email,
      isActive: true,
      isEmailVerified: true,
    });

    const message =
      "If an account exists with this email, a password reset link will be sent.";

    if (!user) {
      res.status(200).json({ success: true, message });
      return;
    }

    const resetToken = randomBytes(32).toString("hex");

    user.passwordResetTokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const clientUrl = process.env.CLIENT_URL;
    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    const resetUrl = new URL(
      `/reset-password/${resetToken}`,
      clientUrl,
    ).toString();

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.error("Password Reset Email Error:", emailError);

      res.status(503).json({
        success: false,
        message: "Unable to send reset email. Please try again later.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

// RESET PASSWORD
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const schema = z.object({
      password: z.string().min(8).max(72),
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
      return;
    }

    const token = req.params.token;

    if (typeof token !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid reset link",
      });
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
      return;
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
      isEmailVerified: true,
    }).select("+passwordResetTokenHash +passwordResetExpires +tokenVersion");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset link. Please request a new one.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        passwordResetTokenHash: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpires: 1,
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      res.status(400).json({
        success: false,
        message: "Reset link has already been used or expired.",
      });
      return;
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid login details",
      });
      return;
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// GET CURRENT USER
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};
