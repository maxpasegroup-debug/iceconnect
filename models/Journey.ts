import mongoose, { Schema, model, models } from "mongoose";

const MilestoneSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true }
}, { _id: false });

const JourneySchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentRank: {
      type: String,
      default: "Distributor",
    },
    nextRank: {
      type: String,
      default: "Senior Consultant",
    },
    monthlyPV: {
      type: Number,
      default: 0,
    },
    monthlyGV: {
      type: Number,
      default: 0,
    },
    activeCustomers: {
      type: Number,
      default: 0,
    },
    activeTeamMembers: {
      type: Number,
      default: 0,
    },
    monthlyNewMembers: {
      type: Number,
      default: 0,
    },
    pvGoal: {
      type: Number,
      default: 2500,
    },
    teamGoal: {
      type: Number,
      default: 10,
    },
    incomeGoal: {
      type: Number,
      default: 50000,
    },
    milestones: {
      type: [MilestoneSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.Journey || model("Journey", JourneySchema);