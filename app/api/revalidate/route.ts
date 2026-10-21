import { NextRequest, NextResponse } from "next/server";
import { revalidateNews } from "@/lib/revalidate-news";

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateNews();
  return NextResponse.json({ revalidated: true });
}
