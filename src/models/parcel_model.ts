import { Schema, model, Types } from "mongoose";
import { IParcel } from "../interfaces/parcel_interface";
import Image from "./image_model";

const parcelSchema = new Schema<IParcel>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    images: [{ type: Types.ObjectId, ref: "Image" }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    purchaseDate: { type: Date },
    reshipperRecivedDate: { type: Date },
    reshipperSentDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "recived", "approved", "rejected", "cancelled", "sent"],
      default: "pending",
    },
    referanceId: { type: String, required: true },
  },
  { timestamps: true }
);

const Parcel = model<IParcel>("Parcel", parcelSchema);

export default Parcel;
