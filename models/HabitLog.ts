import mongoose, { Schema, model, models } from "mongoose";

const HabitLogSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    habitId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export default models.HabitLog || model("HabitLog", HabitLogSchema);
