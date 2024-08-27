import { Document, Types } from "mongoose";
import { IImages } from "./image_interface";

export interface IParcel extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  images: IImages[];
  toAddress: Types.ObjectId;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  purchaseDate?: Date;
  reshipperId?: Types.ObjectId;
  reshipperRecivedDate?: Date;
  reshipperSentDate?: Date;
  reshipperRecivedQuantity?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  referenceId: string;
}
