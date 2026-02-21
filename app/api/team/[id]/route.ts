import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
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

// UPDATE TEAM MEMBER
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await req.json();

    const member = await Team.findOne({ _id: id, owner: userId });
    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    // Update allowed fields
    const allowedFields = ['name', 'phone', 'role', 'rank', 'joiningDate', 'personalVolume', 'teamVolume', 'level', 'performanceTag', 'status', 'sponsor'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'joiningDate') {
          member[field] = new Date(updates[field]);
        } else {
          member[field] = updates[field];
        }
      }
    }

    await member.save();

    return NextResponse.json({ message: "Member updated", member }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// DELETE TEAM MEMBER
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const member = await Team.findOne({ _id: id, owner: userId });
    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    await Team.deleteOne({ _id: id });

    return NextResponse.json({ message: "Member deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
