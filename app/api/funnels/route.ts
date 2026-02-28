import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Funnel from "@/models/Funnel";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const FUNNEL_TYPES = ["weight-loss", "business", "product", "custom"] as const;

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

function normalizeQuestions(
  raw: unknown
): Array<{ question: string; options: string[] }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const question =
        typeof obj.question === "string" ? obj.question.trim() : "";
      const opts = obj.options;
      const options = Array.isArray(opts)
        ? opts.map((o) => (typeof o === "string" ? o : String(o)))
        : [];
      return { question, options };
    })
    .filter((x): x is { question: string; options: string[] } => x !== null);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = body.name;
    const type = body.type;
    const questions = normalizeQuestions(body.questions);
    const redirectMessageTemplate =
      typeof body.redirectMessageTemplate === "string"
        ? body.redirectMessageTemplate
        : "";

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "name is required" }, { status: 400 });
    }
    if (
      !type ||
      typeof type !== "string" ||
      !FUNNEL_TYPES.includes(type as (typeof FUNNEL_TYPES)[number])
    ) {
      return NextResponse.json(
        { message: "type must be one of: weight-loss, business, product, custom" },
        { status: 400 }
      );
    }

    const funnel = await Funnel.create({
      userId,
      name: name.trim(),
      type,
      questions,
      redirectMessageTemplate,
    });

    return NextResponse.json(funnel, { status: 201 });
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

    const funnels = await Funnel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(funnels, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id ?? body._id;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    const funnel = await Funnel.findOne({ _id: id, userId });
    if (!funnel) {
      return NextResponse.json({ message: "Funnel not found" }, { status: 404 });
    }

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : funnel.name;
      if (!name) {
        return NextResponse.json({ message: "name cannot be empty" }, { status: 400 });
      }
      funnel.name = name;
    }
    if (body.type !== undefined) {
      const type = body.type;
      if (
        !type ||
        typeof type !== "string" ||
        !FUNNEL_TYPES.includes(type as (typeof FUNNEL_TYPES)[number])
      ) {
        return NextResponse.json(
          { message: "type must be one of: weight-loss, business, product, custom" },
          { status: 400 }
        );
      }
      funnel.type = type;
    }
    if (body.questions !== undefined) {
      funnel.questions = normalizeQuestions(body.questions);
    }
    if (body.redirectMessageTemplate !== undefined) {
      funnel.redirectMessageTemplate =
        typeof body.redirectMessageTemplate === "string"
          ? body.redirectMessageTemplate
          : "";
    }
    if (body.isActive !== undefined) {
      funnel.isActive = Boolean(body.isActive);
    }

    await funnel.save();
    return NextResponse.json(funnel, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id ?? body._id;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    const result = await Funnel.findOneAndDelete({ _id: id, userId });
    if (!result) {
      return NextResponse.json({ message: "Funnel not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
