import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FunnelPage } from "@/models/DigitalLab";
import FunnelLead from "@/models/FunnelLead";

// Public endpoint - no auth required
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const funnelPage = await FunnelPage.findOne({ slug, isActive: true });
    if (!funnelPage) {
      return NextResponse.json({ message: "Page not found" }, { status: 404 });
    }

    // Increment views
    await FunnelPage.findByIdAndUpdate(funnelPage._id, { $inc: { views: 1 } });

    return NextResponse.json({
      headline: funnelPage.headline,
      subheadline: funnelPage.subheadline,
      ctaText: funnelPage.ctaText,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// Submit lead form - public endpoint
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const { name, phone, email, utmSource, utmMedium, utmCampaign } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone required" }, { status: 400 });
    }

    const funnelPage = await FunnelPage.findOne({ slug, isActive: true });
    if (!funnelPage) {
      return NextResponse.json({ message: "Page not found" }, { status: 404 });
    }

    // Determine source from UTM or default
    let source = "Direct";
    if (utmSource?.toLowerCase().includes("whatsapp")) source = "WhatsApp";
    else if (utmSource?.toLowerCase().includes("instagram") || utmSource?.toLowerCase().includes("ig")) source = "Instagram";
    else if (utmSource?.toLowerCase().includes("facebook") || utmSource?.toLowerCase().includes("fb")) source = "Facebook";

    // Create funnel lead
    const funnelLead = await FunnelLead.create({
      owner: funnelPage.owner,
      funnelId: funnelPage._id,
      name,
      phone,
      email: email || "",
      source,
      utmSource: utmSource || "",
      utmMedium: utmMedium || "",
      utmCampaign: utmCampaign || "",
    });

    // Increment conversions
    await FunnelPage.findByIdAndUpdate(funnelPage._id, { $inc: { conversions: 1 } });

    return NextResponse.json({
      message: funnelPage.thankYouMessage,
      leadId: funnelLead._id,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}