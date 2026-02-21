import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Helper: Get user ID from JWT
async function getUserFromToken() {
  const cookieStore = await cookies(); // ✅ FIXED
  const token = cookieStore.get("ice_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string };

    return decoded.id;
  } catch {
    return null;
  }
}

// ADD TEAM MEMBER
export async function POST(req: Request) {
  try {
    await connectDB();

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, phone, role } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const newMember = await Team.create({
      owner: userId,
      name,
      phone,
      role,
    });

    return NextResponse.json(
      { message: "Team member added", member: newMember },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}

// GET MY TEAM
export async function GET() {
  try {
    await connectDB();

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const members = await Team.find({ owner: userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ members }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}