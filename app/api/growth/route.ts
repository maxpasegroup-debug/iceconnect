import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VolumeLog from "@/models/VolumeLog";
import RankStatus from "@/models/RankStatus";
import MonthlyPerformance from "@/models/MonthlyPerformance";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COMMISSION_PER_SHAKE = 80;
const VOLUME_PER_SHAKE = 2;

const requestMap = new Map<string, { count: number; lastRequest: number }>();

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

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const entry = requestMap.get(userId);
    if (!entry || now - entry.lastRequest >= 60000) {
      requestMap.set(userId, { count: 1, lastRequest: now });
    } else {
      entry.count += 1;
      if (entry.count > 10) {
        return NextResponse.json({ message: "Too many requests" }, { status: 429 });
      }
    }

    const body = await req.json();
    const rawShake = body.shakeCount;
    if (rawShake === undefined || rawShake === null) {
      return NextResponse.json({ message: "Invalid shake count" }, { status: 400 });
    }
    const shakeCount = typeof rawShake === "number" ? rawShake : Number(rawShake);
    if (
      !Number.isFinite(shakeCount) ||
      !Number.isInteger(shakeCount) ||
      shakeCount <= 0 ||
      shakeCount > 50
    ) {
      return NextResponse.json({ message: "Invalid shake count" }, { status: 400 });
    }

    const monthKey = getMonthKey();
    const volumeEarned = shakeCount * VOLUME_PER_SHAKE;
    const commission = shakeCount * COMMISSION_PER_SHAKE;

    await VolumeLog.create({
      userId,
      shakeCount,
      volumeEarned,
    });

    let rank = await RankStatus.findOne({ userId });
    if (!rank) {
      rank = await RankStatus.create({ userId, currentMonth: monthKey });
    }

    const rankWithLegacy = rank as { currentMonth?: string; totalVolume?: number; commissionEarned?: number };
    if (!rankWithLegacy.currentMonth) {
      const monthKeyMigration = getMonthKey();
      rank.lifetimeVolume = rankWithLegacy.totalVolume ?? 0;
      rank.lifetimeCommission = rankWithLegacy.commissionEarned ?? 0;
      rank.currentMonthlyVolume = 0;
      rank.currentMonthlyCommission = 0;
      rank.currentLevelPercent = 35;
      rank.currentMonth = monthKeyMigration;
    }

    if (rank.currentMonth !== monthKey) {
      await MonthlyPerformance.findOneAndUpdate(
        { userId, month: rank.currentMonth },
        {
          userId,
          month: rank.currentMonth,
          monthlyVolume: rank.currentMonthlyVolume,
          monthlyCommission: rank.currentMonthlyCommission,
          levelPercent: rank.currentLevelPercent,
        },
        { upsert: true }
      );
      rank.currentMonthlyVolume = 0;
      rank.currentMonthlyCommission = 0;
      rank.currentLevelPercent = 35;
      rank.currentMonth = monthKey;
    }

    let milestone: string | undefined;

    rank.lifetimeVolume += volumeEarned;
    rank.lifetimeCommission += commission;
    rank.currentMonthlyVolume += volumeEarned;
    rank.currentMonthlyCommission += commission;

    if (rank.currentMonthlyVolume >= 200) {
      rank.currentLevelPercent = 50;
    } else if (rank.currentMonthlyVolume >= 100) {
      rank.currentLevelPercent = 42;
    } else {
      rank.currentLevelPercent = 35;
    }
    await rank.save();

    if (rank.currentMonthlyVolume >= 200) {
      milestone = "Reached 200 Volume!";
    } else if (rank.currentMonthlyVolume >= 100) {
      milestone = "Reached 100 Volume!";
    }

    const responseBody: { message: string; rankStatus: typeof rank; milestone?: string } = {
      message: "Shake recorded",
      rankStatus: rank,
    };
    if (milestone) {
      responseBody.milestone = milestone;
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
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
    const history = searchParams.get("history") === "true";

    if (history) {
      const records = await MonthlyPerformance.find({ userId })
        .sort({ month: -1 })
        .lean();
      return NextResponse.json({ history: records }, { status: 200 });
    }

    if (leaderboard) {
      const top = await RankStatus.find()
        .sort({ lifetimeVolume: -1 })
        .limit(10)
        .lean();
      return NextResponse.json({ leaderboard: top }, { status: 200 });
    }

    let rank = await RankStatus.findOne({ userId });
    if (!rank) {
      rank = await RankStatus.create({
        userId,
        currentMonth: getMonthKey(),
      });
    }

    const rankWithLegacyGet = rank as { currentMonth?: string; totalVolume?: number; commissionEarned?: number };
    if (!rankWithLegacyGet.currentMonth) {
      const monthKey = getMonthKey();
      rank.lifetimeVolume = rankWithLegacyGet.totalVolume ?? 0;
      rank.lifetimeCommission = rankWithLegacyGet.commissionEarned ?? 0;
      rank.currentMonthlyVolume = 0;
      rank.currentMonthlyCommission = 0;
      rank.currentLevelPercent = 35;
      rank.currentMonth = monthKey;
    }

    return NextResponse.json(
      {
        rankStatus: {
          lifetimeVolume: rank.lifetimeVolume,
          lifetimeCommission: rank.lifetimeCommission,
          currentMonthlyVolume: rank.currentMonthlyVolume,
          currentMonthlyCommission: rank.currentMonthlyCommission,
          currentLevelPercent: rank.currentLevelPercent,
          currentMonth: rank.currentMonth,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
