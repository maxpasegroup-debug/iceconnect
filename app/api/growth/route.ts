import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VolumeLog from "@/models/VolumeLog";
import RankStatus from "@/models/RankStatus";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COMMISSION_PER_SHAKE = 80;
const VOLUME_PER_SHAKE = 2;

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

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawShake = body.shakeCount;
    if (rawShake === undefined || rawShake === null) {
      return NextResponse.json({ error: "Invalid shake count" }, { status: 400 });
    }
    const shakeCount = typeof rawShake === "number" ? rawShake : Number(rawShake);
    if (!Number.isFinite(shakeCount) || shakeCount <= 0) {
      return NextResponse.json({ error: "Invalid shake count" }, { status: 400 });
    }

    const volumeEarned = shakeCount * VOLUME_PER_SHAKE;
    const commission = shakeCount * COMMISSION_PER_SHAKE;

    await VolumeLog.create({
      userId,
      shakeCount,
      volumeEarned,
    });

    let rank = await RankStatus.findOne({ userId });
    if (!rank) {
      rank = await RankStatus.create({ userId });
    }

    rank.totalVolume += volumeEarned;
    rank.commissionEarned += commission;
    if (rank.totalVolume >= 200) {
      rank.levelPercent = 50;
    } else if (rank.totalVolume >= 100) {
      rank.levelPercent = 42;
    } else {
      rank.levelPercent = 35;
    }
    await rank.save();

    return NextResponse.json({ message: "Shake recorded", rankStatus: rank }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leaderboard = searchParams.get("leaderboard") === "true";

    if (leaderboard) {
      const top = await RankStatus.find()
        .sort({ totalVolume: -1 })
        .limit(10)
        .lean();
      return NextResponse.json({ leaderboard: top }, { status: 200 });
    }

    let rank = await RankStatus.findOne({ userId });
    if (!rank) {
      rank = await RankStatus.create({
        userId,
        totalVolume: 0,
        levelPercent: 35,
        commissionEarned: 0,
      });
    }

    return NextResponse.json({ rankStatus: rank }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
