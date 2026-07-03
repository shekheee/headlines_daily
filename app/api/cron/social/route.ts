// Manual/HTTP trigger for the themed Instagram post.
//   curl -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/cron/social?dry=1"
//
// The daily scheduler runs scripts/social-post.ts directly (no serverless limit).
import { NextRequest, NextResponse } from "next/server";
import { generateSocialPost } from "@/lib/social/generate-social";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  try {
    const result = await generateSocialPost(new Date(), { dryRun });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "social generation failed" },
      { status: 500 }
    );
  }
}
