import { Document, Types } from "mongoose";

export interface IAddress extends Document {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  countryCode: string;
  phoneNumber: string;
  isDeleted: boolean;
  deletedAt?: Date;
}
