import mongoose, { Schema, model, models } from "mongoose";

const CustomerSchema = new Schema(
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
    phone: {
      type: String,
      required: true,
    },
    productPlan: {
      type: String,
      default: "",
    },
    subscriptionStatus: {
      type: String,
      enum: ["Active", "Expired"],
      default: "Active",
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    monthlyVolume: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default models.Customer || model("Customer", CustomerSchema);
