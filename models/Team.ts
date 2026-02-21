import mongoose, { Schema, model, models } from "mongoose";

const TeamSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sponsor: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Junior Partner",
    },
    rank: {
      type: String,
      default: "Distributor",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    personalVolume: {
      type: Number,
      default: 0,
    },
    teamVolume: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    performanceTag: {
      type: String,
      enum: ["Hot", "Needs Support", "Top Performer", "New"],
      default: "New",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default models.Team || model("Team", TeamSchema);