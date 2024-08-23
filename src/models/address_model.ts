import { Schema, model, Types } from "mongoose";
import { IAddress } from "../interfaces/address_interface";

const addressSchema = new Schema<IAddress>(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    countryCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const Address = model<IAddress>("Address", addressSchema);

export default Address;
