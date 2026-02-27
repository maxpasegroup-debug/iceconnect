import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Dream from "@/models/Dream";
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

function calculateMonthsRemaining(targetDate: Date): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  if (end <= start) {
    return 0;
  }
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() > start.getDate()) {
    months += 1;
  }
  return months;
}

function computeStatus(monthsRemaining: number): "on-track" | "at-risk" {
  return monthsRemaining <= 0 ? "at-risk" : "on-track";
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, targetAmount, targetDate, why } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ message: "title is required" }, { status: 400 });
    }

    const amountNum = Number(targetAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ message: "targetAmount must be a positive number" }, { status: 400 });
    }

    const parsedDate = targetDate ? new Date(targetDate) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ message: "valid targetDate is required" }, { status: 400 });
    }

    const monthsRemaining = calculateMonthsRemaining(parsedDate);
    const status = computeStatus(monthsRemaining);
    const monthlyIncomeRequired =
      monthsRemaining > 0 ? amountNum / monthsRemaining : amountNum;

    const dream = await Dream.create({
      userId,
      title: title.trim(),
      description: typeof description === "string" ? description : "",
      targetAmount: amountNum,
      targetDate: parsedDate,
      why: typeof why === "string" ? why : "",
      monthlyIncomeRequired,
      status,
    });

    return NextResponse.json(dream, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dreams = await Dream.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(dreams, { status: 200 });
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
    const { id } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    const deleted = await Dream.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ message: "Dream not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, targetAmount, targetDate, why } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    const updates: Partial<{
      title: string;
      targetAmount: number;
      targetDate: Date;
      why: string;
      monthlyIncomeRequired: number;
      status: "on-track" | "at-risk" | "achieved";
    }> = {};

    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return NextResponse.json({ message: "title cannot be empty" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    let amountNum: number | undefined;
    if (targetAmount !== undefined) {
      amountNum = Number(targetAmount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { message: "targetAmount must be a positive number" },
          { status: 400 }
        );
      }
      updates.targetAmount = amountNum;
    }

    let parsedDate: Date | undefined;
    if (targetDate !== undefined) {
      const d = new Date(targetDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: "targetDate must be a valid date" }, { status: 400 });
      }
      parsedDate = d;
      updates.targetDate = d;
    }

    if (why !== undefined) {
      updates.why = typeof why === "string" ? why : "";
    }

    // Need existing dream to recalc derived fields if not fully provided
    const existing = await Dream.findOne({ _id: id, userId });
    if (!existing) {
      return NextResponse.json({ message: "Dream not found" }, { status: 404 });
    }

    const finalAmount = amountNum !== undefined ? amountNum : existing.targetAmount;
    const finalDate = parsedDate ?? existing.targetDate;

    const monthsRemaining = calculateMonthsRemaining(finalDate);
    const status = computeStatus(monthsRemaining);
    const monthlyIncomeRequired =
      monthsRemaining > 0 ? finalAmount / monthsRemaining : finalAmount;

    updates.monthlyIncomeRequired = monthlyIncomeRequired;
    updates.status = status;

    const updated = await Dream.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Dream not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

