import { Document, Types } from "mongoose";
import { IImages } from "./image_interface";
import { IAddress } from "./address_interface";
import { IUser } from "./user_interface";

export interface IParcel extends Document {
  userId: Types.ObjectId | IUser;
  name: string;
  description?: string;
  price: number;
  images: Types.ObjectId[];
  toAddress: Types.ObjectId | IAddress;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  purchaseDate?: Date;
  reshipperId?: Types.ObjectId | IUser;
  reshipperNote?: string;
  reshipperRecivedDate?: Date;
  reshipperSendDate?: Date;
  deliverdDate?: Date;
  reshipperRecivedQuantity?: number;
  status: string;
  trackingNumber: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
  referenceId: string;
}
