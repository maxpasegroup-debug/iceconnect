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

// ADD CUSTOMER
export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, productPlan, subscriptionStatus, renewalDate, monthlyVolume, paymentMode, notes } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ message: "Name and phone are required" }, { status: 400 });
    }

    const newCustomer = await Customer.create({
      owner: userId,
      name,
      phone,
      productPlan: productPlan || "",
      subscriptionStatus: subscriptionStatus || "Active",
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      monthlyVolume: monthlyVolume || 0,
      paymentMode: paymentMode || "Cash",
      notes: notes || "",
    });

    return NextResponse.json({ message: "Customer added", customer: newCustomer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// GET MY CUSTOMERS WITH STATS
export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    let query: Record<string, unknown> = { owner: userId };
    
    if (filter === "active") {
      query.subscriptionStatus = "Active";
    } else if (filter === "expired") {
      query.subscriptionStatus = "Expired";
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    // Calculate stats
    const allCustomers = await Customer.find({ owner: userId });
    const activeCount = allCustomers.filter(c => c.subscriptionStatus === "Active").length;
    const expiredCount = allCustomers.filter(c => c.subscriptionStatus === "Expired").length;
    const totalRevenue = allCustomers
      .filter(c => c.subscriptionStatus === "Active")
      .reduce((sum, c) => sum + (c.monthlyVolume || 0), 0);

    // Renewals within 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = allCustomers.filter(c => {
      if (!c.renewalDate) return false;
      const renewalDate = new Date(c.renewalDate);
      return renewalDate >= now && renewalDate <= sevenDaysFromNow;
    }).length;

    const stats = {
      totalCustomers: allCustomers.length,
      activeCount,
      expiredCount,
      totalRevenue,
      upcomingRenewals,
    };

    return NextResponse.json({ customers, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
