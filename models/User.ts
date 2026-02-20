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
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);