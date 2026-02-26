import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    pin: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["junior", "club", "organization"],
      default: "junior",
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
    salesBoosterActive: {
      type: Boolean,
      default: false,
    },
    // Digital Lab Add-On (₹999/month)
    digitalLabActive: {
      type: Boolean,
      default: false,
    },
    digitalLabExpiry: {
      type: Date,
      default: null,
    },
    // Marketing Support Package (₹4999/month)
    marketingSupportActive: {
      type: Boolean,
      default: false,
    },
    marketingSupportExpiry: {
      type: Date,
      default: null,
    },
    // Onboarding Module (₹3000 one-time)
    onboardingFeePaid: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    sponsorId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);