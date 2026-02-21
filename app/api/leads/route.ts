import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Helper: Get user ID from JWT
async function getUserFromToken() {
  const cookieStore = await cookies();
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

// ADD LEAD
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

    const { name, source, status, followUpDate, notes } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const newLead = await Lead.create({
      owner: userId,
      name,
      source: source || "WhatsApp",
      status: status || "Cold",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      notes: notes || "",
    });

    return NextResponse.json(
      { message: "Lead added", lead: newLead },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}

// GET MY LEADS
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

    const leads = await Lead.find({ owner: userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ leads }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
