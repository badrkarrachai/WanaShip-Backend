import { Document, Types } from "mongoose";

export interface IImages extends Document {
  name: string;
  url: string;
  isDeleted: boolean;
  deletedAt?: Date;
}
