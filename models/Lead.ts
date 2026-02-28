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
      enum: [
        "WhatsApp",
        "Instagram",
        "Referral",
        "Manual",
        "Funnel",
        "Other",
        "whatsapp",
        "facebook",
        "instagram",
        "link",
      ],
      default: "WhatsApp",
    },
    status: {
      type: String,
      enum: ["New", "Hot", "Warm", "Cold", "converted"],
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
    funnelId: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [String],
      default: [],
    },
    whatsappClicked: {
      type: Boolean,
      default: false,
    },
    assignedBot: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default models.Lead || model("Lead", LeadSchema);
