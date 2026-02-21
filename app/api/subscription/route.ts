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

// GET subscription status
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("-pin");

    return NextResponse.json({
      digitalLab: {
        active: user?.digitalLabActive || false,
        expiry: user?.digitalLabExpiry,
        price: 999,
      },
      marketingSupport: {
        active: user?.marketingSupportActive || false,
        expiry: user?.marketingSupportExpiry,
        price: 4999,
      },
      onboarding: {
        paid: user?.onboardingFeePaid || false,
        completed: user?.onboardingCompleted || false,
        status: user?.onboardingStatus || "not_started",
        price: 3000,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// Activate subscription (mock payment - in production integrate actual payment)
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, paymentId } = await req.json();

    const updateData: Record<string, unknown> = {};
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    switch (type) {
      case "digital_lab":
        updateData.digitalLabActive = true;
        updateData.digitalLabExpiry = expiryDate;
        break;
      case "marketing_support":
        updateData.marketingSupportActive = true;
        updateData.marketingSupportExpiry = expiryDate;
        break;
      case "onboarding":
        updateData.onboardingFeePaid = true;
        updateData.onboardingStatus = "in_progress";
        break;
      default:
        return NextResponse.json({ message: "Invalid subscription type" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-pin");

    return NextResponse.json({
      message: "Subscription activated",
      user,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}