import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Administrator";

    if (!email || !password || password.length < 12) {
      throw new Error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters)",
      );
    }

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("This email is already registered.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });

    console.log("Admin created successfully!");
  } catch (error) {
    console.error("Admin creation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
