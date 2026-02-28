import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DailyHabit from "@/models/DailyHabit";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

async function getUserFromToken(): Promise<string | null> {
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

    const date = getTodayKey();
    let doc = await DailyHabit.findOne({ userId, date }).lean();

    if (!doc) {
      const created = await DailyHabit.create({
        userId,
        date,
        post: false,
        followup: false,
        learning: false,
        streak: 0,
      });
      doc = created.toObject ? created.toObject() : created;
    }

    return NextResponse.json(
      {
        habit: {
          post: doc.post ?? false,
          followup: doc.followup ?? false,
          learning: doc.learning ?? false,
          streak: doc.streak ?? 0,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
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
    const post = body.post === true || body.post === false ? body.post : undefined;
    const followup = body.followup === true || body.followup === false ? body.followup : undefined;
    const learning = body.learning === true || body.learning === false ? body.learning : undefined;

    const date = getTodayKey();
    let doc = await DailyHabit.findOne({ userId, date });

    if (!doc) {
      doc = await DailyHabit.create({
        userId,
        date,
        post: false,
        followup: false,
        learning: false,
        streak: 0,
      });
    }

    if (post !== undefined) doc.post = post;
    if (followup !== undefined) doc.followup = followup;
    if (learning !== undefined) doc.learning = learning;

    const allThree = doc.post && doc.followup && doc.learning;

    if (allThree) {
      const yesterdayKey = getYesterdayKey();
      const yesterday = await DailyHabit.findOne({ userId, date: yesterdayKey }).lean();
      if (yesterday && yesterday.post && yesterday.followup && yesterday.learning) {
        doc.streak = (yesterday.streak ?? 0) + 1;
      } else {
        doc.streak = 1;
      }
    }

    await doc.save();

    return NextResponse.json(
      {
        habit: {
          post: doc.post,
          followup: doc.followup,
          learning: doc.learning,
          streak: doc.streak ?? 0,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
