import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User.js";

interface AuthPayload extends JwtPayload {
  userId: string;
  role: "student" | "admin";
  tokenVersion: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "student" | "admin";
      };
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Please login first",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      !decoded.userId ||
      !["student", "admin"].includes(decoded.role) ||
      !Number.isInteger(decoded.tokenVersion)
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const payload = decoded as AuthPayload;

    const user = await User.findById(payload.userId).select("+tokenVersion");

    if (
      !user ||
      !user.isActive ||
      user.tokenVersion !== payload.tokenVersion ||
      user.role !== payload.role
    ) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
    });
  }
};

// ADMIN ONLY
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
};
