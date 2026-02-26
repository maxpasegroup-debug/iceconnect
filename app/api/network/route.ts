import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RankStatus from "@/models/RankStatus";
import NetworkStats from "@/models/NetworkStats";
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
      const top = await NetworkStats.find()
        .sort({ totalDownlineVolume: -1 })
        .limit(10)
        .lean();
      return NextResponse.json(top, { status: 200 });
    }

    const referrals = await User.find({ sponsorId: userId }).select("_id").lean();
    const referralIds = referrals.map((r) => String(r._id));

    let totalDownlineVolume = 0;
    if (referralIds.length > 0) {
      const rankDocs = await RankStatus.find({ userId: { $in: referralIds } })
        .select("lifetimeVolume")
        .lean();
      totalDownlineVolume = rankDocs.reduce((sum, r) => sum + (r.lifetimeVolume ?? 0), 0);
    }

    const totalDownlineCount = referralIds.length;

    await NetworkStats.findOneAndUpdate(
      { userId },
      { totalDownlineCount, totalDownlineVolume },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { totalDownlineCount, totalDownlineVolume },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
