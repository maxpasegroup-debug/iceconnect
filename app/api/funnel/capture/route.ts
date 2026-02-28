import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Funnel from "@/models/Funnel";
import Lead from "@/models/Lead";
import User from "@/models/User";

const INTEREST_KEYWORDS = ["interested", "business", "buy"];

function normalizeAnswers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => (typeof a === "string" ? a : String(a ?? "")));
}

function calculateScore(
  answers: string[],
  questionCount: number
): number {
  let score = 0;
  if (questionCount > 0 && answers.length >= questionCount) {
    score += 20;
  }
  const first = answers[0]?.toLowerCase() ?? "";
  if (INTEREST_KEYWORDS.some((k) => first.includes(k))) {
    score += 10;
  }
  for (const a of answers) {
    if (a.length > 5) score += 5;
  }
  return score;
}

function getStatus(score: number): "hot" | "warm" | "cold" {
  if (score >= 40) return "hot";
  if (score >= 20) return "warm";
  return "cold";
}

function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("6") === false) {
    return "91" + digits;
  }
  return digits || "91";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const funnelId = body.funnelId;
    const name = body.name;
    const phone = body.phone;
    const answers = normalizeAnswers(body.answers);

    if (!funnelId || typeof funnelId !== "string" || !funnelId.trim()) {
      return NextResponse.json(
        { message: "funnelId is required" },
        { status: 400 }
      );
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "name is required" },
        { status: 400 }
      );
    }
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { message: "phone is required" },
        { status: 400 }
      );
    }

    const funnel = await Funnel.findOne({
      _id: funnelId,
      isActive: true,
    }).lean();

    if (!funnel) {
      return NextResponse.json(
        { message: "Funnel not found or inactive" },
        { status: 404 }
      );
    }

    const questionCount = Array.isArray(funnel.questions)
      ? funnel.questions.length
      : 0;
    const score = calculateScore(answers, questionCount);
    const status = getStatus(score);

    const ownerId =
      mongoose.Types.ObjectId.isValid(funnel.userId) &&
      String(funnel.userId).length === 24
        ? new mongoose.Types.ObjectId(funnel.userId)
        : null;

    if (!ownerId) {
      return NextResponse.json(
        { message: "Invalid funnel owner" },
        { status: 500 }
      );
    }

    const lead = await Lead.create({
      owner: ownerId,
      name: name.trim(),
      source: "link",
      status: status.charAt(0).toUpperCase() + status.slice(1),
      funnelId: funnelId.trim(),
      answers,
      score,
    });

    const user = await User.findById(funnel.userId)
      .select("phone")
      .lean();
    const whatsappNumber = user?.phone
      ? formatWhatsAppNumber(String(user.phone))
      : "91";
    const summary = answers.length
      ? answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n")
      : "No answers";
    const message = [
      `New lead from funnel: ${funnel.name}`,
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      "",
      "Answers:",
      summary,
    ].join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return NextResponse.json(
      { whatsappUrl, leadId: String(lead._id) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
