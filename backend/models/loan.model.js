import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ["lent", "borrowed"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Loan", loanSchema);
