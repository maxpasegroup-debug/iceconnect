import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Journey from "@/models/Journey";
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

    let journey = await Journey.findOne({ owner: userId });
    
    if (!journey) {
      journey = await Journey.create({ owner: userId });
    }

    return NextResponse.json({ journey }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    
    const journey = await Journey.findOneAndUpdate(
      { owner: userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Journey updated", journey }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { milestone } = await req.json();
    
    if (!milestone || !milestone.title || !milestone.date) {
      return NextResponse.json({ message: "Invalid milestone" }, { status: 400 });
    }

    const journey = await Journey.findOneAndUpdate(
      { owner: userId },
      { $push: { milestones: milestone } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Milestone added", journey }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}