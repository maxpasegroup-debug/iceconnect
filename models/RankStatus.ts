import mongoose, { Schema, model, models } from "mongoose";

const RankStatusSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    lifetimeVolume: {
      type: Number,
      default: 0,
    },
    lifetimeCommission: {
      type: Number,
      default: 0,
    },
    currentMonthlyVolume: {
      type: Number,
      default: 0,
    },
    currentMonthlyCommission: {
      type: Number,
      default: 0,
    },
    currentLevelPercent: {
      type: Number,
      default: 35,
    },
    currentMonth: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

RankStatusSchema.index({ userId: 1 }, { unique: true });

export default models.RankStatus || model("RankStatus", RankStatusSchema);
