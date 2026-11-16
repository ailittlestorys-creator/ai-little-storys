import jwt from "jsonwebtoken";
import type { Response } from "express";

interface TokenPayload {
  userId: string;
  role: "student" | "admin";
  tokenVersion: number;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
};

export const setTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};
