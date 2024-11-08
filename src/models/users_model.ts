import { Schema, model, Types } from "mongoose";
import { IUser } from "../interfaces/user_interface";
import { ROLES } from "../config/permissions";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    avatar: { type: Schema.Types.ObjectId, ref: "Image" },
    addresses: [{ type: Types.ObjectId, ref: "Address" }],
    isActivated: { type: Boolean, default: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    lastLogin: { type: Date },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    reasonForDeletion: { type: [String], default: [] },
    awayDateStart: { type: Date },
    awayDateEnd: { type: Date },
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
    // OAuth fields
    googleId: { type: String, unique: true, sparse: true },
    discordId: { type: String, unique: true, sparse: true },
    appleId: { type: String, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google", "discord", "apple"],
      default: "local",
    },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });
userSchema.index({ appleId: 1 }, { sparse: true });

const User = model<IUser>("User", userSchema);

export default User;
