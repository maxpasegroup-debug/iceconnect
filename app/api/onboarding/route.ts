import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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

const ONBOARDING_STEPS = [
  { id: "profile", title: "Complete Profile", description: "Add your details and profile picture" },
  { id: "social", title: "Link Social Profiles", description: "Connect Instagram, Facebook, WhatsApp" },
  { id: "funnel", title: "Setup Funnel Page", description: "Customize your landing page" },
  { id: "template", title: "Create DM Templates", description: "Add at least 3 message templates" },
  { id: "team", title: "Add Team Members", description: "Import your first team member" },
  { id: "customer", title: "Add First Customer", description: "Add your first customer to CRM" },
  { id: "lead", title: "Create First Lead", description: "Add your first sales lead" },
];

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("-pin");

    return NextResponse.json({
      onboardingFeePaid: user?.onboardingFeePaid || false,
      onboardingCompleted: user?.onboardingCompleted || false,
      onboardingStatus: user?.onboardingStatus || "not_started",
      steps: ONBOARDING_STEPS,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, completed } = await req.json();
    
    const updateData: Record<string, unknown> = {};
    if (status) updateData.onboardingStatus = status;
    if (completed !== undefined) updateData.onboardingCompleted = completed;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-pin");

    return NextResponse.json({ message: "Onboarding updated", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}