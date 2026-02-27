import mongoose, { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpaySubscriptionId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "cancelled"],
      default: "trialing",
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
    plan: {
      type: String,
      default: "crm_pro",
    },
    amount: {
      type: Number,
      default: 1700,
    },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1 }, { unique: true });

export default models.Subscription || model("Subscription", SubscriptionSchema);
