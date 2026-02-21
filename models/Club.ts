import mongoose, { Schema, model, models } from "mongoose";

const ClubSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentClubLevel: {
      type: String,
      enum: ["None", "Club 100", "Club 200", "Club 300", "President's Club"],
      default: "None",
    },
    pvRequired: {
      type: Number,
      default: 2500,
    },
    gvRequired: {
      type: Number,
      default: 10000,
    },
    activeLinesRequired: {
      type: Number,
      default: 3,
    },
    currentPV: {
      type: Number,
      default: 0,
    },
    currentGV: {
      type: Number,
      default: 0,
    },
    activeLines: {
      type: Number,
      default: 0,
    },
    qualificationMonth: {
      type: Date,
      default: null,
    },
    maintenanceStatus: {
      type: String,
      enum: ["Qualified", "At Risk", "Not Qualified"],
      default: "Not Qualified",
    },
  },
  { timestamps: true }
);

export default models.Club || model("Club", ClubSchema);