import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Achievement from "@/models/Achievement";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const LEVELS = [
  { name: "Customer", required: 0 },
  { name: "Associate", required: 100 },
  { name: "Senior Consultant", required: 500 },
  { name: "Success Builder", required: 1000 },
  { name: "Qualified Producer", required: 2500 },
  { name: "Supervisor", required: 4000 },
];

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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const achievements = await Achievement.find({ userId })
      .sort({ unlockedAt: 1 })
      .lean();
    return NextResponse.json(achievements);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const currentMonthlyVolume =
      typeof body?.currentMonthlyVolume === "number" ? body.currentMonthlyVolume : 0;

    const unlocked: string[] = [];

    for (const level of LEVELS) {
      if (currentMonthlyVolume < level.required) continue;
      const exists = await Achievement.findOne({
        userId,
        levelName: level.name,
      }).lean();
      if (exists) continue;
      try {
        await Achievement.create({
          userId,
          levelName: level.name,
          volumeAtUnlock: currentMonthlyVolume,
        });
        unlocked.push(level.name);
      } catch {
        // unique index conflict or other; skip
      }
    }

    return NextResponse.json({ unlocked });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
