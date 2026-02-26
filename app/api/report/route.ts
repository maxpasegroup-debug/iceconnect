import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RankStatus from "@/models/RankStatus";
import MonthlyPerformance from "@/models/MonthlyPerformance";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import PDFDocument from "pdfkit";

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

    const rank = await RankStatus.findOne({ userId }).lean();
    const history = await MonthlyPerformance.find({ userId }).sort({ month: 1 }).lean();

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    return await new Promise<NextResponse>((resolve, reject) => {
      doc.on("data", (chunk) => {
        chunks.push(chunk as Buffer);
      });
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(buffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": "attachment; filename=performance-report.pdf",
            },
          })
        );
      });
      doc.on("error", (err) => {
        reject(err);
      });

      doc.fontSize(18).text("ICECONNECT Performance Report", { align: "center" });
      doc.moveDown();

      const lifetimeVolume = rank?.lifetimeVolume ?? 0;
      const lifetimeCommission = rank?.lifetimeCommission ?? 0;
      const currentMonthlyVolume = rank?.currentMonthlyVolume ?? 0;
      const currentLevelPercent = rank?.currentLevelPercent ?? 35;

      doc.fontSize(12);
      doc.text(`Lifetime Volume: ${lifetimeVolume}`);
      doc.text(`Lifetime Commission: ₹${lifetimeCommission}`);
      doc.text(`Current Month Volume: ${currentMonthlyVolume}`);
      doc.text(`Current Level %: ${currentLevelPercent}%`);

      doc.moveDown();
      doc.fontSize(14).text("Monthly History", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12);
      const tableHeader = ["Month", "Volume", "Commission", "Level %"];
      const columnWidths = [120, 100, 120, 80];

      const startX = doc.x;
      let y = doc.y;

      tableHeader.forEach((header, i) => {
        const width = columnWidths[i];
        doc.text(header, startX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), y, {
          width,
          continued: i < tableHeader.length - 1,
        });
      });
      doc.moveDown(0.5);
      y = doc.y;

      history.forEach((row) => {
        const cells = [
          row.month,
          String(row.monthlyVolume ?? 0),
          `₹${row.monthlyCommission ?? 0}`,
          `${row.levelPercent ?? 0}%`,
        ];
        cells.forEach((cell, i) => {
          const width = columnWidths[i];
          doc.text(cell, startX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), y, {
            width,
            continued: i < cells.length - 1,
          });
        });
        doc.moveDown(0.5);
        y = doc.y;
      });

      doc.end();
    });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

