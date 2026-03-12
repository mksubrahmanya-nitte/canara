import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    challengeType: {
      type: String,
      enum: ["daily_limit", "category_avoidance", "savings_goal"],
      required: true,
    },
    // For category_avoidance: the category to avoid
    category: {
      type: String,
      default: null,
    },
    // For daily_limit: max spend per day. For savings_goal: target savings amount.
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number, // in days
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Points awarded when the challenge is completed
    points: {
      type: Number,
      default: 0,
    },
    // 0–100 percent for savings_goal; days without violation for others
    progress: {
      type: Number,
      default: 0,
    },
    // Consecutive successful days
    streak: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Challenge", challengeSchema);
