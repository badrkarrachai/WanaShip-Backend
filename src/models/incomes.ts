import { Schema, model, Types } from "mongoose";

const incomeSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    source: { type: String, required: true },
    date: { type: Date, required: true },
    user: { type: Types.ObjectId, ref: "User", required: true }, // Reference to User
  },
  { timestamps: true }
);

const Income = model("Income", incomeSchema);

export default Income;
