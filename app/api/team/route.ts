import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
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

// ADD TEAM MEMBER
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, role, rank, joiningDate, personalVolume, teamVolume, level, performanceTag, sponsor } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone are required" }, { status: 400 });
    }

    const newMember = await Team.create({
      owner: userId,
      name,
      phone,
      role: role || "Junior Partner",
      rank: rank || "Distributor",
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      personalVolume: personalVolume || 0,
      teamVolume: teamVolume || 0,
      level: level || 1,
      performanceTag: performanceTag || "New",
      sponsor: sponsor || null,
    });

    return NextResponse.json({ message: "Team member added", member: newMember }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// GET MY TEAM WITH STATS
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const members = await Team.find({ owner: userId }).sort({ createdAt: -1 });

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalActiveMembers = members.filter(m => m.status === "Active").length;
    const totalTeamVolume = members.reduce((sum, m) => sum + (m.teamVolume || 0) + (m.personalVolume || 0), 0);
    const newMembersThisMonth = members.filter(m => new Date(m.createdAt) >= startOfMonth).length;

    const stats = {
      totalActiveMembers,
      totalTeamVolume,
      newMembersThisMonth,
      totalMembers: members.length,
    };

    return NextResponse.json({ members, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
