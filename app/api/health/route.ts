import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import HealthMetric from "@/models/HealthMetric";
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
    const metrics = await HealthMetric.find({ userId })
      .sort({ recordedAt: -1 })
      .lean();
    return NextResponse.json(metrics, { status: 200 });
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
    const weight = body.weight != null ? Number(body.weight) : NaN;
    const bodyFat = body.bodyFat != null ? Number(body.bodyFat) : NaN;
    const muscleMass = body.muscleMass != null ? Number(body.muscleMass) : NaN;
    if (!Number.isFinite(weight) || !Number.isFinite(bodyFat) || !Number.isFinite(muscleMass)) {
      return NextResponse.json({ message: "weight, bodyFat, and muscleMass required" }, { status: 400 });
    }
    const recordedAt = body.recordedAt ? new Date(body.recordedAt) : new Date();
    const metric = await HealthMetric.create({
      userId,
      weight,
      bodyFat,
      muscleMass,
      recordedAt,
    });
    return NextResponse.json(metric, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
