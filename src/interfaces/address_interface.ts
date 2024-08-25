import { Document, Types } from "mongoose";

export interface IAddress extends Document {
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  countryCode: string;
  phoneNumber: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
