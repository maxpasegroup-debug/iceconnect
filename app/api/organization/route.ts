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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all team members for organization view
    const members = await Team.find({ owner: userId }).sort({ level: 1, createdAt: -1 });

    // Group by level
    const levelGroups: Record<number, typeof members> = {};
    let totalVolume = 0;
    
    members.forEach(member => {
      const lvl = member.level || 1;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(member);
      totalVolume += (member.personalVolume || 0) + (member.teamVolume || 0);
    });

    // Find strongest and weakest lines (by volume at level 1)
    const level1Members = levelGroups[1] || [];
    let strongestLine: typeof members[0] | null = null;
    let weakestLine: typeof members[0] | null = null;
    let maxVolume = -1;
    let minVolume = Infinity;

    level1Members.forEach(member => {
      const vol = (member.personalVolume || 0) + (member.teamVolume || 0);
      if (vol > maxVolume) {
        maxVolume = vol;
        strongestLine = member;
      }
      if (vol < minVolume) {
        minVolume = vol;
        weakestLine = member;
      }
    });

    const stats = {
      totalMembers: members.length,
      totalVolume,
      levelCount: Object.keys(levelGroups).length,
      strongestLine: strongestLine ? { name: (strongestLine as typeof members[0]).name, volume: maxVolume } : null,
      weakestLine: weakestLine ? { name: (weakestLine as typeof members[0]).name, volume: minVolume } : null,
    };

    return NextResponse.json({ members, levelGroups, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}