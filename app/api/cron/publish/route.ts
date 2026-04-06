// Vercel cron job: runs every minute to publish scheduled articles
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/publish", "schedule": "* * * * *" }] }
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  return NextResponse.json({ published: result.count, at: now.toISOString() });
}
