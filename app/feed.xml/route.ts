import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate";

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const items = articles
    .map((a) => {
      const title = escapeXml(a.title);
      const description = escapeXml(a.excerpt || "");
      const author = escapeXml(a.author.name || "Staff");
      const category = a.category ? escapeXml(a.category.name) : "";
      const pubDate = a.publishedAt?.toUTCString() ?? new Date().toUTCString();
      const link = `${appUrl}/articles/${a.slug}`;
      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <author>${author}</author>
      ${category ? `<category>${category}</category>` : ""}
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(appName)}</title>
    <link>${appUrl}</link>
    <description>Latest news from ${escapeXml(appName)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${appUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
