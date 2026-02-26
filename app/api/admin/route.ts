import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import RankStatus from "@/models/RankStatus";
import VolumeLog from "@/models/VolumeLog";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import mongoose from "mongoose";

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

async function requireAdmin() {
  const userId = await getUserFromToken();
  if (!userId) {
    return { authorized: false as const, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  await connectDB();
  const user = await User.findById(userId).select("role").lean();
  if (!user || user.role !== "admin") {
    return { authorized: false as const, response: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }
  return { authorized: true as const, userId };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const list = await RankStatus.find()
      .select("userId lifetimeVolume currentMonthlyVolume lifetimeCommission")
      .lean();
    const users = list.map((r) => ({
      userId: r.userId,
      lifetimeVolume: r.lifetimeVolume ?? 0,
      currentMonthlyVolume: r.currentMonthlyVolume ?? 0,
      lifetimeCommission: r.lifetimeCommission ?? 0,
    }));
    return NextResponse.json(users, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json();
    const { userId, adjustVolume } = body;
    if (userId === undefined || userId === null) {
      return NextResponse.json({ message: "userId required" }, { status: 400 });
    }
    const amount = typeof adjustVolume === "number" ? adjustVolume : Number(adjustVolume);
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ message: "Invalid adjustVolume" }, { status: 400 });
    }
    const rank = await RankStatus.findOne({ userId });
    if (!rank) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    rank.lifetimeVolume += amount;
    rank.currentMonthlyVolume += amount;
    await rank.save();
    return NextResponse.json(
      {
        userId: rank.userId,
        lifetimeVolume: rank.lifetimeVolume,
        currentMonthlyVolume: rank.currentMonthlyVolume,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json();
    const { volumeLogId } = body;
    if (volumeLogId === undefined || volumeLogId === null) {
      return NextResponse.json({ message: "volumeLogId required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(volumeLogId)) {
      return NextResponse.json({ message: "Invalid volumeLogId" }, { status: 400 });
    }
    const deleted = await VolumeLog.findByIdAndDelete(volumeLogId);
    if (!deleted) {
      return NextResponse.json({ message: "Volume log not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
