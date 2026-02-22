import mongoose, { Schema, model, models } from "mongoose";

const LeadSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["WhatsApp", "Instagram", "Referral", "Manual", "Funnel", "Other"],
      default: "WhatsApp",
    },
    status: {
      type: String,
      enum: ["New", "Hot", "Warm", "Cold"],
      default: "New",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default models.Lead || model("Lead", LeadSchema);
