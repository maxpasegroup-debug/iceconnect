import mongoose, { Schema, model, models } from "mongoose";

// Leads captured from funnel page
const FunnelLeadSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    funnelId: {
      type: Schema.Types.ObjectId,
      ref: "FunnelPage",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["WhatsApp", "Instagram", "Facebook", "Direct", "Other"],
      default: "Direct",
    },
    utmSource: {
      type: String,
      default: "",
    },
    utmMedium: {
      type: String,
      default: "",
    },
    utmCampaign: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    notes: {
      type: String,
      default: "",
    },
    convertedToLead: {
      type: Boolean,
      default: false,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
  },
  { timestamps: true }
);

export default models.FunnelLead || model("FunnelLead", FunnelLeadSchema);