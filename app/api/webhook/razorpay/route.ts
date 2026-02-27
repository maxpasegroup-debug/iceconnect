import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

function getSubscriptionIdFromPayload(payload: Record<string, unknown>, event: string): string | null {
  const p = payload.payload as Record<string, unknown> | undefined;
  if (!p) return null;
  if (event.startsWith("subscription.")) {
    const sub = p.subscription as { entity?: { id?: string } } | undefined;
    return sub?.entity?.id ?? null;
  }
  if (event === "payment.failed") {
    const payment = p.payment as { entity?: { subscription_id?: string } } | undefined;
    return payment?.entity?.subscription_id ?? null;
  }
  return null;
}

function getNextBillingFromPayload(payload: Record<string, unknown>): Date | null {
  const p = payload.payload as Record<string, unknown> | undefined;
  const sub = p?.subscription as { entity?: { current_end?: number; charge_at?: number } } | undefined;
  const ts = sub?.entity?.current_end ?? sub?.entity?.charge_at;
  if (typeof ts === "number" && ts > 0) {
    return new Date(ts * 1000);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const event = typeof payload.event === "string" ? payload.event : "";
    const subscriptionId = getSubscriptionIdFromPayload(payload, event);

    if (!subscriptionId) {
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    await connectDB();
    const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

    if (!subscription) {
      return NextResponse.json({ message: "OK" }, { status: 200 });
    }

    switch (event) {
      case "subscription.activated": {
        const nextBilling = getNextBillingFromPayload(payload);
        subscription.status = "active";
        if (nextBilling) subscription.nextBillingDate = nextBilling;
        await subscription.save();
        break;
      }
      case "subscription.charged": {
        const nextBilling = getNextBillingFromPayload(payload);
        subscription.status = "active";
        if (nextBilling) subscription.nextBillingDate = nextBilling;
        await subscription.save();
        break;
      }
      case "subscription.cancelled":
        subscription.status = "cancelled";
        await subscription.save();
        break;
      case "payment.failed":
        subscription.status = "past_due";
        await subscription.save();
        break;
      default:
        break;
    }

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
