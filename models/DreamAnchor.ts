import { Schema, model, models } from "mongoose";

const DreamAnchorSchema = new Schema(
  {
    userId: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    cost: { type: Number, required: true },
    targetDate: { type: Date, required: true },
    timelineMonths: { type: Number, required: true },
    monthlyRequired: { type: Number, required: true },
    volumeRequired: { type: Number, required: true },
    why: { type: String, required: true },
    /** Base64 data URL string for dream image (e.g. data:image/jpeg;base64,...) */
    imageUrl: { type: String, default: "" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

DreamAnchorSchema.index({ userId: 1 });

export default models.DreamAnchor ?? model("DreamAnchor", DreamAnchorSchema);
