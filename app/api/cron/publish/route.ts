// Publish scheduled drafts once daily; see vercel.json.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateNews } from "@/lib/revalidate-news";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const result = await prisma.article.updateMany({
    where: {
      status: "DRAFT",
      publishedAt: { not: null, lte: now },
    },
    data: { status: "PUBLISHED" },
  });

  if (result.count) revalidateNews();
  return NextResponse.json({ published: result.count, at: now.toISOString() });
}
