import { Schema, model, models } from "mongoose";

const AchievementSchema = new Schema(
  {
    userId: { type: String, required: true },
    levelName: { type: String, required: true },
    volumeAtUnlock: { type: Number, required: true },
    unlockedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

AchievementSchema.index({ userId: 1, levelName: 1 }, { unique: true });

export default models.Achievement ?? model("Achievement", AchievementSchema);
