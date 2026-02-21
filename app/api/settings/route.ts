import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import User from "@/models/User";
import Team from "@/models/Team";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
import Journey from "@/models/Journey";
import Club from "@/models/Club";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

    let settings = await Settings.findOne({ owner: userId });
    const user = await User.findById(userId).select("-pin");
    
    if (!settings) {
      settings = await Settings.create({ owner: userId });
    }

    return NextResponse.json({ settings, user }, { status: 200 });
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

    const { type, data } = await req.json();

    if (type === "profile") {
      const updateData: Record<string, string> = {};
      if (data.name) updateData.name = data.name;
      
      if (data.newPin && data.currentPin) {
        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(data.currentPin, user.pin);
        if (!isMatch) {
          return NextResponse.json({ message: "Current PIN is incorrect" }, { status: 400 });
        }
        updateData.pin = await bcrypt.hash(data.newPin, 10);
      }
      
      await User.findByIdAndUpdate(userId, { $set: updateData });
      const user = await User.findById(userId).select("-pin");
      return NextResponse.json({ message: "Profile updated", user }, { status: 200 });
    }

    if (type === "business") {
      const settings = await Settings.findOneAndUpdate(
        { owner: userId },
        { $set: data },
        { new: true, upsert: true }
      );
      return NextResponse.json({ message: "Business settings updated", settings }, { status: 200 });
    }

    if (type === "profilePicture") {
      const settings = await Settings.findOneAndUpdate(
        { owner: userId },
        { $set: { profilePicture: data.profilePicture } },
        { new: true, upsert: true }
      );
      return NextResponse.json({ message: "Profile picture updated", settings }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid update type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();

    if (type === "logout-all") {
      const cookieStore = await cookies();
      cookieStore.delete("ice_token");
      return NextResponse.json({ message: "Logged out from all sessions" }, { status: 200 });
    }

    if (type === "delete-account") {
      await Team.deleteMany({ owner: userId });
      await Customer.deleteMany({ owner: userId });
      await Lead.deleteMany({ owner: userId });
      await Journey.deleteOne({ owner: userId });
      await Club.deleteOne({ owner: userId });
      await Settings.deleteOne({ owner: userId });
      await User.findByIdAndDelete(userId);
      
      const cookieStore = await cookies();
      cookieStore.delete("ice_token");
      
      return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}