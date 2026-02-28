import mongoose, { Schema, model, models } from "mongoose";

const FunnelQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const FunnelSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["weight-loss", "business", "product", "custom"],
      required: true,
    },
    questions: {
      type: [FunnelQuestionSchema],
      default: [],
    },
    redirectMessageTemplate: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

FunnelSchema.index({ userId: 1 });

export default models.Funnel || model("Funnel", FunnelSchema);
