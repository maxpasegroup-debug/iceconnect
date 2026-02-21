import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SocialProfile } from "@/models/DigitalLab";
import User from "@/models/User";
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

// UPDATE social profiles
export async function PUT(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user?.digitalLabActive) {
      return NextResponse.json({ message: "Digital Lab subscription required" }, { status: 403 });
    }

    const updates = await req.json();
    
    const socialProfile = await SocialProfile.findOneAndUpdate(
      { owner: userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Social profiles updated", socialProfile }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}