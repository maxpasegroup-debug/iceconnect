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

// UPDATE template
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

    const user = await User.findById(userId);
    if (!user?.digitalLabActive) {
      return NextResponse.json({ message: "Digital Lab subscription required" }, { status: 403 });
    }

    const { id } = await params;
    const updates = await req.json();

    const template = await DMTemplate.findOneAndUpdate(
      { _id: id, owner: userId },
      { $set: updates },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Template updated", template }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// DELETE template
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

    const template = await DMTemplate.findOneAndDelete({ _id: id, owner: userId });
    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Template deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// INCREMENT usage count
export async function PUT(
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

    const template = await DMTemplate.findOneAndUpdate(
      { _id: id, owner: userId },
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Usage recorded", template }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}