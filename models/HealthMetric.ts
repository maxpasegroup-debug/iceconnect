import mongoose, { Schema, model, models } from "mongoose";

const HealthMetricSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    bodyFat: {
      type: Number,
      required: true,
    },
    muscleMass: {
      type: Number,
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default models.HealthMetric || model("HealthMetric", HealthMetricSchema);
