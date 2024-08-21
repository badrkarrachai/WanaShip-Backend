import { Schema, model, Types } from "mongoose";

const ExpensesSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    descreption: { type: String },
    date: { type: Date, required: true },
    category: { type: Types.ObjectId, ref: "Category", required: true }, // Reference to Category
    user: { type: Types.ObjectId, ref: "User", required: true }, // Reference to User
  },
  { timestamps: true }
);

const Expenses = model("Expense", ExpensesSchema);

export default Expenses;
