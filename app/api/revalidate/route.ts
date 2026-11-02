import { NextRequest, NextResponse } from "next/server";
import { revalidateNews } from "@/lib/revalidate-news";

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.text();
  let slugs: string[] = [];
  if (body) {
    try {
      const input = JSON.parse(body);
      if (!Array.isArray(input.slugs) || input.slugs.length > 100 ||
          input.slugs.some((slug: unknown) => typeof slug !== "string" || !/^[a-z0-9-]{1,300}$/.test(slug))) {
        return NextResponse.json({ error: "Invalid article slugs" }, { status: 400 });
      }
      slugs = input.slugs;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!slugs.length) return NextResponse.json({ revalidated: false });
  }
  revalidateNews(slugs);
  return NextResponse.json({ revalidated: true });
}
