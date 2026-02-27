import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUserFromToken(): Promise<string | null> {
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

export async function POST() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!keyId || !keySecret || !planId) {
      return NextResponse.json(
        { message: "Payment configuration is incomplete" },
        { status: 500 }
      );
    }

    const existing = await Subscription.findOne({ userId }).lean();
    if (existing && (existing.status === "trialing" || existing.status === "active")) {
      return NextResponse.json(existing, { status: 200 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);
    const startAt = Math.floor(trialEndsAt.getTime() / 1000);

    const subscriptionPayload = {
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      start_at: startAt,
    };

    const rzpSubscription = await razorpay.subscriptions.create(subscriptionPayload);
    const razorpaySubscriptionId =
      typeof rzpSubscription === "object" && rzpSubscription?.id
        ? String(rzpSubscription.id)
        : "";

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        razorpaySubscriptionId,
        status: "trialing",
        trialEndsAt,
        nextBillingDate: trialEndsAt,
        plan: "crm_pro",
        amount: 1700,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(subscription, { status: 201 });
  } catch (err) {
    const message = err && typeof err === "object" && "description" in err
      ? String((err as { description: unknown }).description)
      : "Something went wrong";
    return NextResponse.json({ message }, { status: 500 });
  }
}
