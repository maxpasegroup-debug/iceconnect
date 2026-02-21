import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
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

// GET REPORTS
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

    // Get date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total counts
    const totalTeam = await Team.countDocuments({ owner: userId });
    const totalCustomers = await Customer.countDocuments({ owner: userId });
    const totalLeads = await Lead.countDocuments({ owner: userId });

    // Active customers
    const activeCustomers = await Customer.countDocuments({ 
      owner: userId, 
      subscriptionStatus: "Active" 
    });

    // Monthly new team members
    const monthlyNewMembers = await Team.countDocuments({
      owner: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Monthly new leads
    const monthlyNewLeads = await Lead.countDocuments({
      owner: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    return NextResponse.json({
      totalTeam,
      totalCustomers,
      totalLeads,
      activeCustomers,
      monthlyNewMembers,
      monthlyNewLeads,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
