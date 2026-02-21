import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FunnelLead from "@/models/FunnelLead";
import Lead from "@/models/Lead";
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

// GET funnel leads
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leads = await FunnelLead.find({ owner: userId }).sort({ createdAt: -1 });

    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      qualified: leads.filter(l => l.status === "qualified").length,
      converted: leads.filter(l => l.status === "converted").length,
      lost: leads.filter(l => l.status === "lost").length,
    };

    return NextResponse.json({ leads, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// Update funnel lead status or convert to main Lead
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadId, status, convertToCRM } = await req.json();

    const funnelLead = await FunnelLead.findOne({ _id: leadId, owner: userId });
    if (!funnelLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    if (convertToCRM && !funnelLead.convertedToLead) {
      // Create main Lead from funnel lead
      const newLead = await Lead.create({
        owner: userId,
        name: funnelLead.name,
        source: funnelLead.source === "Direct" ? "Referral" : funnelLead.source,
        status: "Warm",
        notes: `Converted from funnel. Original source: ${funnelLead.utmSource || "Direct"}`,
      });

      funnelLead.convertedToLead = true;
      funnelLead.leadId = newLead._id;
      funnelLead.status = "converted";
      await funnelLead.save();

      return NextResponse.json({ message: "Lead converted to CRM", lead: newLead, funnelLead }, { status: 200 });
    }

    if (status) {
      funnelLead.status = status;
      await funnelLead.save();
    }

    return NextResponse.json({ message: "Lead updated", funnelLead }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}