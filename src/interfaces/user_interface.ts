import { Document, Types } from "mongoose";
import { IAddress } from "./address_interface";
import { IImages } from "./image_interface";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  password: string;
  avatar?: IImages;
  addresses?: IAddress[];
  isActivated: boolean;
  role: string;
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
