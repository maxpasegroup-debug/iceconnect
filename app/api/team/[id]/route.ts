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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { id: string };

    return decoded.id;
  } catch {
    return null;
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = context.params;

    const member = await Team.findOne({
      _id: id,
      owner: userId,
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    await Team.deleteOne({ _id: id });

    return NextResponse.json(
      { message: "Member deleted" },
      { status: 200 }
    );

  } catch {
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}