import { Schema, model, Types } from "mongoose";

const CategoriesSchema = new Schema(
  {
    name: { type: String, required: true },
    descreption: { type: String },
  },
  { timestamps: true }
);

const Categories = model("Categorie", CategoriesSchema);

export default Categories;
