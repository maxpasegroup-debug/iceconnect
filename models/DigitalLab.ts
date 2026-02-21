import mongoose, { Schema, model, models } from "mongoose";

// Social Profile Links
const SocialProfileSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    instagram: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    whatsapp: {
      type: String,
      default: "",
    },
    youtube: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Funnel Landing Page
const FunnelPageSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    headline: {
      type: String,
      default: "Transform Your Health Today",
    },
    subheadline: {
      type: String,
      default: "Join thousands who have achieved their wellness goals",
    },
    ctaText: {
      type: String,
      default: "Get Started Now",
    },
    thankYouMessage: {
      type: String,
      default: "Thank you! We will contact you soon.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// DM Templates
const DMTemplateSchema = new Schema(
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
    category: {
      type: String,
      enum: ["introduction", "follow_up", "closing", "objection", "other"],
      default: "other",
    },
    content: {
      type: String,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Follow-up Reminders
const FollowUpReminderSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },
    leadName: {
      type: String,
      required: true,
    },
    reminderDate: {
      type: Date,
      required: true,
    },
    reminderTime: {
      type: String,
      default: "10:00",
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "missed"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["WhatsApp", "Instagram", "Facebook", "Referral", "Funnel", "Other"],
      default: "Other",
    },
  },
  { timestamps: true }
);

export const SocialProfile = models.SocialProfile || model("SocialProfile", SocialProfileSchema);
export const FunnelPage = models.FunnelPage || model("FunnelPage", FunnelPageSchema);
export const DMTemplate = models.DMTemplate || model("DMTemplate", DMTemplateSchema);
export const FollowUpReminder = models.FollowUpReminder || model("FollowUpReminder", FollowUpReminderSchema);