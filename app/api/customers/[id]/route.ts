import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
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

// UPDATE CUSTOMER
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

    const customer = await Customer.findOne({ _id: id, owner: userId });
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'productPlan', 'subscriptionStatus', 'renewalDate', 'monthlyVolume', 'paymentMode', 'notes'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'renewalDate') {
          customer[field] = updates[field] ? new Date(updates[field]) : null;
        } else {
          customer[field] = updates[field];
        }
      }
    }

    await customer.save();

    return NextResponse.json({ message: "Customer updated", customer }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// DELETE CUSTOMER
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

    const customer = await Customer.findOne({ _id: id, owner: userId });
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    await Customer.deleteOne({ _id: id });

    return NextResponse.json({ message: "Customer deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
