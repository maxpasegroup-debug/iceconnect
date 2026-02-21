import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    monthlyTarget: {
      type: Number,
      default: 5000,
    },
    currency: {
      type: String,
      default: "INR",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default models.Settings || model("Settings", SettingsSchema);