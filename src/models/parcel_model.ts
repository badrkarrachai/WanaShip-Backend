import { Schema, model, Types } from "mongoose";
import { IParcel } from "../interfaces/parcel_interface";
import Image from "./image_model";

export const STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  RECIVED: "recived",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  SENT: "sent",
};

const parcelSchema = new Schema<IParcel>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{ type: Types.ObjectId, ref: "Image" }],
    toAddress: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    quantity: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    purchaseDate: { type: Date },
    reshipperId: { type: Schema.Types.ObjectId, ref: "User" },
    reshipperNote: { type: String },
    reshipperRecivedDate: { type: Date },
    reshipperSendDate: { type: Date },
    deliverdDate: { type: Date },
    reshipperRecivedQuantity: { type: Number, default: null },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: "pending",
    },
    trackingNumber: { type: String, required: true },
    weight: { type: Number, required: true },
    referenceId: { type: String, required: true },
  },
  { timestamps: true }
);

const Parcel = model<IParcel>("Parcel", parcelSchema);

export default Parcel;
