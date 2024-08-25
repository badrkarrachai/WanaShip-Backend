import { Schema, model, Types } from "mongoose";
import { IUser } from "../interfaces/user_interface";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    avatar: { type: Types.ObjectId, ref: "Image" },
    addresses: [{ type: Types.ObjectId, ref: "Address" }],
    isActivated: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["reshipper", "admin", "user"],
      default: "user",
    },
    lastLogin: { type: Date },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    reasonForDeletion: { type: [String], default: [] },
    preferences: {
      currency: { type: String, default: "USD" },
      language: { type: String, default: "en" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
    socialMedia: {
      facebook: { type: String },
      x: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
