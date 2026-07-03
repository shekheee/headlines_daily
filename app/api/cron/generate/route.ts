// Daily news generation: pull RSS headlines, rewrite each into an original
// article with Gemini, publish it, and post the top story to Instagram.
//
// Triggered on a schedule (Render Cron Job) with:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/generate
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { estimateReadingTime } from "@/lib/utils";
import { FEED_SOURCES } from "@/lib/news-feeds";
import { fetchFeed, type RssItem } from "@/lib/rss";
import { rewriteArticle } from "@/lib/gemini";
import { buildCaption, isInstagramConfigured, postToInstagram } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ITEMS_PER_FEED = 3;
const DEFAULT_MAX_PER_RUN = 8;

async function ensureAuthor() {
  return prisma.user.upsert({
    where: { email: "newsroom-ai@dailynews.com" },
    update: {},
    create: {
      email: "newsroom-ai@dailynews.com",
      name: "Newsroom AI",
      role: "EDITOR",
      bio: "Automated newsroom assistant. Articles are AI-drafted from public reporting and reviewed by editors.",
    },
  });
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true }).slice(0, 80) || `story-${Date.now()}`;
  const existing = await prisma.article.findFirst({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  return slug;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const maxPerRun = Math.min(
    parseInt(searchParams.get("limit") || String(DEFAULT_MAX_PER_RUN)),
    15
  );

  const started = Date.now();
  const author = await ensureAuthor();
  const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true } });
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  // Collect candidate items across feeds.
  const candidates: { item: RssItem; categorySlug: string; sourceName: string }[] = [];
  const feedErrors: string[] = [];
  for (const feed of FEED_SOURCES) {
    if (!catBySlug.has(feed.categorySlug)) continue;
    try {
      const items = await fetchFeed(feed.url);
      for (const item of items.slice(0, ITEMS_PER_FEED)) {
        candidates.push({ item, categorySlug: feed.categorySlug, sourceName: feed.name });
      }
    } catch (e) {
      feedErrors.push(`${feed.name}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // Drop items we've already ingested (by source URL).
  const links = candidates.map((c) => c.item.link);
  const existing = await prisma.article.findMany({
    where: { sourceUrl: { in: links } },
    select: { sourceUrl: true },
  });
  const seen = new Set(existing.map((e) => e.sourceUrl));

  // Newest first, unique by link, capped.
  const fresh = candidates
    .filter((c) => !seen.has(c.item.link))
    .filter((c, i, arr) => arr.findIndex((x) => x.item.link === c.item.link) === i)
    .sort((a, b) => (b.item.publishedAt?.getTime() || 0) - (a.item.publishedAt?.getTime() || 0))
    .slice(0, maxPerRun);

  const created: { id: string; title: string; excerpt: string; slug: string; category: string; image: string | null }[] = [];
  const errors: string[] = [...feedErrors];

  for (const c of fresh) {
    try {
      const rewritten = await rewriteArticle({
        sourceTitle: c.item.title,
        sourceSummary: c.item.summary,
        sourceName: c.sourceName,
        category: catBySlug.get(c.categorySlug)!.name,
      });
      if (!rewritten) {
        errors.push(`rewrite failed: ${c.item.title.slice(0, 60)}`);
        continue;
      }
      const slug = await uniqueSlug(rewritten.title);
      const article = await prisma.article.create({
        data: {
          title: rewritten.title,
          slug,
          content: rewritten.content,
          excerpt: rewritten.excerpt,
          featuredImage: c.item.imageUrl,
          featuredImageAlt: rewritten.title,
          status: "PUBLISHED",
          publishedAt: new Date(),
          readingTime: estimateReadingTime(rewritten.content),
          metaTitle: rewritten.title.slice(0, 60),
          metaDescription: rewritten.metaDescription,
          sourceUrl: c.item.link,
          authorId: author.id,
          categoryId: catBySlug.get(c.categorySlug)!.id,
          tags: rewritten.tags.length
            ? {
                connectOrCreate: rewritten.tags.map((name) => {
                  const tagSlug = slugify(name, { lower: true, strict: true }) || name;
                  return { where: { slug: tagSlug }, create: { name, slug: tagSlug } };
                }),
              }
            : undefined,
        },
      });
      created.push({
        id: article.id,
        title: article.title,
        excerpt: rewritten.excerpt,
        slug: article.slug,
        category: c.categorySlug,
        image: c.item.imageUrl,
      });
    } catch (e) {
      errors.push(`create failed: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  // Post the top newly-created story to Instagram (no-op until configured).
  let instagram: unknown = { skipped: "no article created" };
  const top = created.find((a) => a.image);
  if (top) {
    instagram = await postToInstagram({
      imageUrl: top.image!,
      caption: buildCaption({
        title: top.title,
        excerpt: top.excerpt,
        category: top.category,
        slug: top.slug,
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    articles: created.map((c) => ({ title: c.title, slug: c.slug, category: c.category })),
    instagramConfigured: isInstagramConfigured(),
    instagram,
    errors: errors.slice(0, 10),
    tookMs: Date.now() - started,
  });
}
