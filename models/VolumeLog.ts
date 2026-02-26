import mongoose, { Schema, model, models } from "mongoose";

const VolumeLogSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    shakeCount: {
      type: Number,
      required: true,
    },
    volumeEarned: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default models.VolumeLog || model("VolumeLog", VolumeLogSchema);
