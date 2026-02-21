import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import Customer from "@/models/Customer";
import Lead from "@/models/Lead";
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

export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get last 6 months for trends
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Basic counts (scoped to owner)
    const totalTeam = await Team.countDocuments({ owner: userId });
    const totalCustomers = await Customer.countDocuments({ owner: userId });
    const totalLeads = await Lead.countDocuments({ owner: userId });
    const activeCustomers = await Customer.countDocuments({ owner: userId, subscriptionStatus: "Active" });

    // Monthly stats
    const monthlyNewMembers = await Team.countDocuments({
      owner: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthlyNewLeads = await Lead.countDocuments({
      owner: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate total PV from team
    const teamMembers = await Team.find({ owner: userId });
    const totalMonthlyPV = teamMembers.reduce((sum, m) => sum + (m.personalVolume || 0), 0);

    // Calculate revenue from customers
    const customers = await Customer.find({ owner: userId, subscriptionStatus: "Active" });
    const totalRevenue = customers.reduce((sum, c) => sum + (c.monthlyVolume || 0), 0);

    // Lead conversion rate
    const convertedLeads = await Lead.countDocuments({ owner: userId, status: "Hot" });
    const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Customer retention rate
    const customerRetentionRate = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;

    // Last 6 months PV trend
    const pvTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleString('default', { month: 'short' });
      
      const monthMembers = await Team.find({
        owner: userId,
        createdAt: { $lte: monthEnd }
      });
      const monthPV = monthMembers.reduce((sum, m) => sum + (m.personalVolume || 0), 0);
      
      pvTrend.push({ month: monthName, pv: monthPV });
    }

    return NextResponse.json({
      totalTeam,
      totalCustomers,
      totalLeads,
      activeCustomers,
      monthlyNewMembers,
      monthlyNewLeads,
      totalMonthlyPV,
      totalRevenue,
      leadConversionRate,
      customerRetentionRate,
      pvTrend,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}