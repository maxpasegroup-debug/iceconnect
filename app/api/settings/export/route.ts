import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import Team from "@/models/Team";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
import Journey from "@/models/Journey";
import Club from "@/models/Club";
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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const team = await Team.find({ owner: userId });
    const customers = await Customer.find({ owner: userId });
    const leads = await Lead.find({ owner: userId });
    const journey = await Journey.findOne({ owner: userId });
    const club = await Club.findOne({ owner: userId });
    const settings = await Settings.findOne({ owner: userId });

    const exportData = {
      exportedAt: new Date().toISOString(),
      team,
      customers,
      leads,
      journey,
      club,
      settings,
    };

    return NextResponse.json(exportData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}