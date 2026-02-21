import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SocialProfile, FunnelPage, DMTemplate, FollowUpReminder } from "@/models/DigitalLab";
import FunnelLead from "@/models/FunnelLead";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ice_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// GET all Digital Lab data
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("-pin");
    const isActive = user?.digitalLabActive || false;

    // Get or create social profile
    let socialProfile = await SocialProfile.findOne({ owner: userId });
    if (!socialProfile && isActive) {
      socialProfile = await SocialProfile.create({ owner: userId });
    }

    // Get or create funnel page
    let funnelPage = await FunnelPage.findOne({ owner: userId });
    if (!funnelPage && isActive) {
      const slug = `${user.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
      funnelPage = await FunnelPage.create({ owner: userId, slug });
    }

    // Get DM templates
    const dmTemplates = isActive ? await DMTemplate.find({ owner: userId }).sort({ createdAt: -1 }) : [];

    // Get follow-up reminders
    const reminders = isActive ? await FollowUpReminder.find({ owner: userId }).sort({ reminderDate: 1 }) : [];

    // Get funnel leads
    const funnelLeads = isActive ? await FunnelLead.find({ owner: userId }).sort({ createdAt: -1 }) : [];

    // Stats
    const stats = {
      totalFunnelLeads: funnelLeads.length,
      newLeads: funnelLeads.filter(l => l.status === "new").length,
      convertedLeads: funnelLeads.filter(l => l.status === "converted").length,
      pendingReminders: reminders.filter(r => r.status === "pending").length,
      funnelViews: funnelPage?.views || 0,
      funnelConversions: funnelPage?.conversions || 0,
      conversionRate: funnelPage?.views > 0 ? Math.round((funnelPage?.conversions / funnelPage?.views) * 100) : 0,
    };

    return NextResponse.json({
      isActive,
      subscription: {
        digitalLabActive: user?.digitalLabActive,
        digitalLabExpiry: user?.digitalLabExpiry,
        marketingSupportActive: user?.marketingSupportActive,
        marketingSupportExpiry: user?.marketingSupportExpiry,
        onboardingFeePaid: user?.onboardingFeePaid,
        onboardingCompleted: user?.onboardingCompleted,
        onboardingStatus: user?.onboardingStatus,
      },
      socialProfile,
      funnelPage,
      dmTemplates,
      reminders,
      funnelLeads,
      stats,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}