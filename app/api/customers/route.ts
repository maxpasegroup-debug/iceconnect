import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
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

// ADD CUSTOMER
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

    const { name, phone, productPlan, subscriptionStatus, renewalDate, monthlyVolume } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Name and phone are required" },
        { status: 400 }
      );
    }

    const newCustomer = await Customer.create({
      owner: userId,
      name,
      phone,
      productPlan: productPlan || "",
      subscriptionStatus: subscriptionStatus || "Active",
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      monthlyVolume: monthlyVolume || 0,
    });

    return NextResponse.json(
      { message: "Customer added", customer: newCustomer },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}

// GET MY CUSTOMERS
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

    const customers = await Customer.find({ owner: userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ customers }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
