import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DMTemplate } from "@/models/DigitalLab";
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

// GET all templates
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const templates = await DMTemplate.find({ owner: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// CREATE template
export async function POST(req: Request) {
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

    const { name, category, content } = await req.json();
    
    if (!name || !content) {
      return NextResponse.json({ message: "Name and content required" }, { status: 400 });
    }

    const template = await DMTemplate.create({
      owner: userId,
      name,
      category: category || "other",
      content,
    });

    return NextResponse.json({ message: "Template created", template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}