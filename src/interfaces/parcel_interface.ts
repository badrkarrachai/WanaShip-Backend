import { Document, Types } from "mongoose";
import { IImages } from "./image_interface";

export interface IParcel extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: IImages[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  purchaseDate?: Date;
  reshipperRecivedDate?: Date;
  reshipperSentDate?: Date;
  status: string;
  referanceId: string;
  createdAt: Date;
  updatedAt: Date;
}
