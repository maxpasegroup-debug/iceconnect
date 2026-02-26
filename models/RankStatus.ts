import mongoose, { Schema, model, models } from "mongoose";

const RankStatusSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    levelPercent: {
      type: Number,
      default: 35,
    },
    commissionEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

RankStatusSchema.index({ userId: 1 }, { unique: true });

export default models.RankStatus || model("RankStatus", RankStatusSchema);
