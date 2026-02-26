import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import HealthMetric from "@/models/HealthMetric";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const EPS = 0.01;

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

function interpret(latest: { weight: number; bodyFat: number; muscleMass: number }, previous: { weight: number; bodyFat: number; muscleMass: number }): string {
  const weightDown = latest.weight < previous.weight - EPS;
  const weightSame = Math.abs(latest.weight - previous.weight) <= EPS;
  const weightUp = latest.weight > previous.weight + EPS;
  const bodyFatDown = latest.bodyFat < previous.bodyFat - EPS;
  const muscleUp = latest.muscleMass > previous.muscleMass + EPS;

  if (weightDown && muscleUp) return "Excellent Progress";
  if (weightSame && bodyFatDown) return "Fat Loss in Progress";
  if (weightUp && muscleUp) return "Lean Gain";
  return "Needs Improvement";
}

export async function POST() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const metrics = await HealthMetric.find({ userId })
      .sort({ recordedAt: -1 })
      .limit(2)
      .lean();
    if (metrics.length < 2) {
      return NextResponse.json(
        { interpretation: "Insufficient data", message: "Record at least two metrics to get an interpretation." },
        { status: 200 }
      );
    }
    const latest = metrics[0];
    const previous = metrics[1];
    const interpretation = interpret(
      { weight: latest.weight, bodyFat: latest.bodyFat, muscleMass: latest.muscleMass },
      { weight: previous.weight, bodyFat: previous.bodyFat, muscleMass: previous.muscleMass }
    );
    return NextResponse.json({ interpretation }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
