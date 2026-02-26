import mongoose, { Schema, model, models } from "mongoose";

const MonthlyPerformanceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    monthlyVolume: {
      type: Number,
      required: true,
    },
    monthlyCommission: {
      type: Number,
      required: true,
    },
    levelPercent: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

MonthlyPerformanceSchema.index({ userId: 1, month: 1 }, { unique: true });

export default models.MonthlyPerformance || model("MonthlyPerformance", MonthlyPerformanceSchema);
