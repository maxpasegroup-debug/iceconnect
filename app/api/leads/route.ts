import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
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

// ADD LEAD
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, source, status, followUpDate, notes } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const newLead = await Lead.create({
      owner: userId,
      name,
      source: source || "WhatsApp",
      status: status || "Cold",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      notes: notes || "",
    });

    return NextResponse.json({ message: "Lead added", lead: newLead }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// GET MY LEADS WITH STATS
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leads = await Lead.find({ owner: userId }).sort({ createdAt: -1 });

    // Calculate stats
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.status === "Hot").length;
    const warmLeads = leads.filter(l => l.status === "Warm").length;
    const coldLeads = leads.filter(l => l.status === "Cold").length;

    // Conversion rate (Hot leads as converted)
    const conversionRate = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0;

    // Follow-ups due today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const followUpsDueToday = leads.filter(l => {
      if (!l.followUpDate) return false;
      const followUp = new Date(l.followUpDate);
      return followUp >= todayStart && followUp <= todayEnd;
    }).length;

    // Overdue follow-ups
    const overdueFollowUps = leads.filter(l => {
      if (!l.followUpDate) return false;
      const followUp = new Date(l.followUpDate);
      return followUp < todayStart;
    }).length;

    const stats = {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      conversionRate,
      followUpsDueToday,
      overdueFollowUps,
    };

    return NextResponse.json({ leads, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
