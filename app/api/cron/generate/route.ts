// Manual/HTTP trigger for daily news generation (also usable by Vercel cron).
// The scheduled Render Cron Job runs scripts/generate-news.ts directly instead,
// so it isn't bound by serverless function time limits.
//
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/cron/generate?limit=4"
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MAX_PER_RUN, generateDailyNews } from "@/lib/generate-news";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  // Keep HTTP runs small so they fit within the serverless time budget.
  const maxPerRun = Math.min(parseInt(searchParams.get("limit") || "3"), DEFAULT_MAX_PER_RUN);

  try {
    const result = await generateDailyNews(maxPerRun);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "generation failed" },
      { status: 500 }
    );
  }
}
