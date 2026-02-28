import mongoose, { Schema, model, models } from "mongoose";

const WhatsAppConfigSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      default: "",
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    defaultMessage: {
      type: String,
      default: "",
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

WhatsAppConfigSchema.index({ userId: 1 }, { unique: true });

export default models.WhatsAppConfig || model("WhatsAppConfig", WhatsAppConfigSchema);
