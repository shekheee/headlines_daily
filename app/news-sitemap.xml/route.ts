// Google News sitemap: articles published in the last 48h, with <news:news>
// tags. This is what Google News/Discover ingests for fresh-content surfacing.
import { prisma } from "@/lib/prisma";
import { APP_NAME, APP_URL } from "@/lib/seo";

export const revalidate = 600; // refresh every 10 min

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const since = new Date(Date.now() - 48 * 3600_000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: { slug: true, title: true, publishedAt: true },
  });

  const items = articles
    .map(
      (a) => `  <url>
    <loc>${xmlEscape(`${APP_URL}/articles/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(APP_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${(a.publishedAt || new Date()).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
