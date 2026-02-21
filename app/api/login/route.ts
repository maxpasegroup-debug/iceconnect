import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { message: "Phone and PIN required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(pin, user.pin);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid PIN" },
        { status: 401 }
      );
    }

    // 🔐 Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // 🍪 Secure HttpOnly Cookie
    response.cookies.set("ice_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}