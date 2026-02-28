import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WhatsAppConfig from "@/models/WhatsAppConfig";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUserFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ice_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";
    const whatsappNumber =
      typeof body.whatsappNumber === "string" ? body.whatsappNumber.trim() : "";
    const defaultMessage =
      typeof body.defaultMessage === "string" ? body.defaultMessage.trim() : "";

    if (!whatsappNumber) {
      return NextResponse.json(
        { message: "whatsappNumber is required" },
        { status: 400 }
      );
    }

    const config = await WhatsAppConfig.findOneAndUpdate(
      { userId },
      {
        userId,
        businessName,
        whatsappNumber,
        defaultMessage,
        isConnected: true,
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(config, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const config = await WhatsAppConfig.findOne({ userId }).lean();
    if (!config) {
      return NextResponse.json({ isConnected: false }, { status: 200 });
    }

    return NextResponse.json(config, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await WhatsAppConfig.deleteOne({ userId });
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
