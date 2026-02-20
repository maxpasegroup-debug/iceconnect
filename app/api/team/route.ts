import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";


// ADD TEAM MEMBER
export async function POST(req: Request) {
  try {
    await connectDB();

    const { ownerPhone, name, phone, role } = await req.json();

    if (!ownerPhone || !name || !phone) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const newMember = await Team.create({
      ownerPhone,
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
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const ownerPhone = searchParams.get("ownerPhone");

    if (!ownerPhone) {
      return NextResponse.json(
        { message: "Owner phone required" },
        { status: 400 }
      );
    }

    const members = await Team.find({ ownerPhone }).sort({ createdAt: -1 });

    return NextResponse.json({ members }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}