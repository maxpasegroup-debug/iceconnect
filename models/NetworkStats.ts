import mongoose, { Schema, model, models } from "mongoose";

const NetworkStatsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    totalDownlineCount: {
      type: Number,
      default: 0,
    },
    totalDownlineVolume: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

NetworkStatsSchema.index({ userId: 1 }, { unique: true });

export default models.NetworkStats || model("NetworkStats", NetworkStatsSchema);
