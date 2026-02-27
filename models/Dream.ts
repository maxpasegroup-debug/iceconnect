import mongoose, { Schema, model, models } from "mongoose";

const DreamSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    why: {
      type: String,
      default: "",
    },
    monthlyIncomeRequired: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["on-track", "at-risk", "achieved"],
      default: "on-track",
    },
  },
  { timestamps: true }
);

DreamSchema.index({ userId: 1 });

export default models.Dream || model("Dream", DreamSchema);

