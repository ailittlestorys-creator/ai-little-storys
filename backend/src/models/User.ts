import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  tokenVersion: number;
  role: "student" | "admin";
  isActive: boolean;
  isEmailVerified: boolean;

  emailVerificationOtpHash?: string;
  emailVerificationOtpExpires?: Date;
  emailVerificationOtpAttempts: number;
  emailVerificationLastSentAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOtpHash: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpires: {
      type: Date,
      select: false,
    },

    emailVerificationOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    emailVerificationLastSentAt: {
      type: Date,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
