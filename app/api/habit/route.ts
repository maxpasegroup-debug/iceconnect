import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Habit from "@/models/Habit";
import HabitLog from "@/models/HabitLog";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
    const habits = await Habit.find({ userId, isActive: true }).lean();
    const today = getDateString();
    const habitIds = habits.map((h) => h._id.toString());
    const logs = await HabitLog.find({
      userId,
      habitId: { $in: habitIds },
      date: today,
    }).lean();
    const logByHabitId = new Map(logs.map((l) => [l.habitId, l.completedCount ?? 0]));
    const list = habits.map((h) => {
      const id = h._id.toString();
      return {
        _id: id,
        userId: h.userId,
        title: h.title,
        targetPerDay: h.targetPerDay ?? 1,
        isActive: h.isActive,
        todayCompletedCount: logByHabitId.get(id) ?? 0,
      };
    });
    return NextResponse.json(list, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
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
    const title = body.title;
    if (title === undefined || title === null || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ message: "title required" }, { status: 400 });
    }
    const targetPerDay = typeof body.targetPerDay === "number" ? body.targetPerDay : Number(body.targetPerDay);
    const habit = await Habit.create({
      userId,
      title: title.trim(),
      targetPerDay: Number.isFinite(targetPerDay) && targetPerDay >= 0 ? targetPerDay : 1,
    });
    return NextResponse.json(habit, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const habitId = body.habitId;
    if (habitId === undefined || habitId === null) {
      return NextResponse.json({ message: "habitId required" }, { status: 400 });
    }
    const completedCount = typeof body.completedCount === "number" ? body.completedCount : Number(body.completedCount);
    if (!Number.isFinite(completedCount) || completedCount < 0) {
      return NextResponse.json({ message: "Invalid completedCount" }, { status: 400 });
    }
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) {
      return NextResponse.json({ message: "Habit not found" }, { status: 404 });
    }
    const date = getDateString();
    const log = await HabitLog.findOneAndUpdate(
      { userId, habitId, date },
      { userId, habitId, date, completedCount },
      { upsert: true, new: true }
    );
    return NextResponse.json(log, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const habitId = body.habitId;
    if (habitId === undefined || habitId === null) {
      return NextResponse.json({ message: "habitId required" }, { status: 400 });
    }
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId },
      { isActive: false },
      { new: true }
    );
    if (!habit) {
      return NextResponse.json({ message: "Habit not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Deactivated" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
