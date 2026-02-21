import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FollowUpReminder } from "@/models/DigitalLab";
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

// GET all reminders
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reminders = await FollowUpReminder.find({ owner: userId }).sort({ reminderDate: 1 });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: reminders.length,
      pending: reminders.filter(r => r.status === "pending").length,
      completed: reminders.filter(r => r.status === "completed").length,
      todayCount: reminders.filter(r => {
        const reminderDate = new Date(r.reminderDate);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate.getTime() === today.getTime() && r.status === "pending";
      }).length,
      overdueCount: reminders.filter(r => {
        const reminderDate = new Date(r.reminderDate);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate < today && r.status === "pending";
      }).length,
    };

    return NextResponse.json({ reminders, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// CREATE reminder
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

    const { leadId, leadName, reminderDate, reminderTime, message, source } = await req.json();
    
    if (!leadName || !reminderDate) {
      return NextResponse.json({ message: "Lead name and reminder date required" }, { status: 400 });
    }

    const reminder = await FollowUpReminder.create({
      owner: userId,
      leadId: leadId || null,
      leadName,
      reminderDate: new Date(reminderDate),
      reminderTime: reminderTime || "10:00",
      message: message || "",
      source: source || "Other",
    });

    return NextResponse.json({ message: "Reminder created", reminder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}