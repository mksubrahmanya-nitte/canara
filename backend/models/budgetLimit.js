import mongoose from "mongoose";

const budgetLimitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // Format: "MM" (01-12)
    year: { type: Number, required: true },
    categoryLimits: [
      {
        category: { type: String, required: true },
        type: { type: String, enum: ["income", "expense"], default: "expense" },
        limit: { type: Number, default: 0, min: 0 },
        spent: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
        isCustom: { type: Boolean, default: false },
        icon: { type: String, default: "Info" },
        sortOrder: { type: Number, default: 0 },
      },
    ],
    customCategories: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ["income", "expense"], default: "expense" },
        icon: { type: String, default: "Tag" },
        createdAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

// Unique compound index: userId + year + month
budgetLimitSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model("BudgetLimit", budgetLimitSchema);
