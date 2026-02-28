import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DreamAnchor from "@/models/DreamAnchor";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COMMISSION_PER_SHAKE = 80;

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
    const dream = await DreamAnchor.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ dream: dream ?? null });
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
    const {
      category,
      title,
      cost,
      targetDate,
      timelineMonths,
      why,
      imageUrl,
    } = body;

    if (
      category == null ||
      (typeof category === "string" && !category.trim()) ||
      title == null ||
      (typeof title === "string" && !title.trim()) ||
      typeof cost !== "number" ||
      Number.isNaN(cost) ||
      cost <= 0 ||
      targetDate == null ||
      timelineMonths == null ||
      typeof timelineMonths !== "number" ||
      timelineMonths <= 0 ||
      why == null ||
      (typeof why === "string" && !why.trim())
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const date = new Date(targetDate);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { message: "Invalid targetDate" },
        { status: 400 }
      );
    }

    const monthlyRequired = cost / timelineMonths;
    const volumeRequired = Math.ceil(monthlyRequired / COMMISSION_PER_SHAKE);

    const dream = await DreamAnchor.create({
      userId,
      category: String(category).trim(),
      title: String(title).trim(),
      cost,
      targetDate: date,
      timelineMonths,
      monthlyRequired,
      volumeRequired,
      why: String(why).trim(),
      imageUrl: imageUrl != null ? String(imageUrl) : "",
    });

    return NextResponse.json({ dream });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
