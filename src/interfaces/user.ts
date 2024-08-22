import { Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  password: string;
  avatar?: string;
  isActivated: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  resetPasswordOTP: String;
  resetPasswordOTPExpires: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  reasonForDeletion?: string[];
  preferences: {
    currency: string;
    language: string;
    theme: string;
  };
  socialMedia?: {
    facebook?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
  };
  notificationSettings: {
    email: boolean;
    push: boolean;
  };
}
