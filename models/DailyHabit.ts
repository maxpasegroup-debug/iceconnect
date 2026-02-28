import mongoose, { Schema, model, models } from "mongoose";

const DailyHabitSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    post: {
      type: Boolean,
      default: false,
    },
    followup: {
      type: Boolean,
      default: false,
    },
    learning: {
      type: Boolean,
      default: false,
    },
    streak: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

DailyHabitSchema.index({ userId: 1, date: 1 }, { unique: true });

export default models.DailyHabit || model("DailyHabit", DailyHabitSchema);
