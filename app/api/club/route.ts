import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
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

    let club = await Club.findOne({ owner: userId });
    
    if (!club) {
      club = await Club.create({ owner: userId });
    }

    return NextResponse.json({ club }, { status: 200 });
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
    
    const club = await Club.findOneAndUpdate(
      { owner: userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Club updated", club }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}