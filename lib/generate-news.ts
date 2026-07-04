// Core daily-news generation: pull RSS headlines, rewrite each into an original
// article with Gemini, publish it, and post the top story to Instagram.
// Used by both the Render cron script and the /api/cron/generate route.
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { estimateReadingTime } from "@/lib/utils";
import { FEED_SOURCES } from "@/lib/news-feeds";
import { fetchFeed, type RssItem } from "@/lib/rss";
import { rewriteArticle } from "@/lib/gemini";
import { generateAndHostArticleImage } from "@/lib/gemini-image";
import { buildCaption, isInstagramConfigured, postToInstagram } from "@/lib/instagram";

const ITEMS_PER_FEED = 4;
export const DEFAULT_MAX_PER_RUN = 30;

export interface GenerateResult {
  ok: boolean;
  created: number;
  articles: { title: string; slug: string; category: string }[];
  instagramConfigured: boolean;
  instagram: unknown;
  errors: string[];
  tookMs: number;
}

async function ensureAuthor() {
  // Keep the original email as the stable key, but present a neutral editorial identity.
  return prisma.user.upsert({
    where: { email: "newsroom-ai@dailynews.com" },
    update: { name: "Lok Mandate Desk", bio: "The Lok Mandate editorial desk." },
    create: {
      email: "newsroom-ai@dailynews.com",
      name: "Lok Mandate Desk",
      role: "EDITOR",
      bio: "The Lok Mandate editorial desk.",
    },
  });
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true }).slice(0, 80) || `story-${Date.now()}`;
  const existing = await prisma.article.findFirst({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  return slug;
}

export async function generateDailyNews(maxPerRun = DEFAULT_MAX_PER_RUN): Promise<GenerateResult> {
  const started = Date.now();
  const author = await ensureAuthor();
  const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true } });
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

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

  const links = candidates.map((c) => c.item.link);
  const existing = await prisma.article.findMany({
    where: { sourceUrl: { in: links } },
    select: { sourceUrl: true },
  });
  const seen = new Set(existing.map((e) => e.sourceUrl));

  const deduped = candidates
    .filter((c) => !seen.has(c.item.link))
    .filter((c, i, arr) => arr.findIndex((x) => x.item.link === c.item.link) === i);

  // Group by category and pick round-robin so every section gets fair coverage
  // (otherwise the newest items from a few busy feeds crowd everyone else out).
  const byCategory = new Map<string, typeof deduped>();
  for (const c of deduped) {
    const arr = byCategory.get(c.categorySlug) ?? [];
    arr.push(c);
    byCategory.set(c.categorySlug, arr);
  }
  for (const arr of byCategory.values()) {
    arr.sort((a, b) => (b.item.publishedAt?.getTime() || 0) - (a.item.publishedAt?.getTime() || 0));
  }
  const fresh: typeof deduped = [];
  let addedInRound = true;
  while (fresh.length < maxPerRun && addedInRound) {
    addedInRound = false;
    for (const arr of byCategory.values()) {
      const next = arr.shift();
      if (next) {
        fresh.push(next);
        addedInRound = true;
        if (fresh.length >= maxPerRun) break;
      }
    }
  }

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

      // Prefer an original AI-generated editorial image; fall back to the RSS thumbnail.
      let imageUrl = c.item.imageUrl;
      const aiImage = await generateAndHostArticleImage({
        title: rewritten.title,
        category: catBySlug.get(c.categorySlug)!.name,
        excerpt: rewritten.excerpt,
      });
      if (aiImage) imageUrl = aiImage;
      else errors.push(`image gen skipped/failed: ${c.item.title.slice(0, 50)}`);

      const article = await prisma.article.create({
        data: {
          title: rewritten.title,
          slug,
          content: rewritten.content,
          excerpt: rewritten.excerpt,
          featuredImage: imageUrl,
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
        image: imageUrl,
      });
    } catch (e) {
      errors.push(`create failed: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  let instagram: unknown = { skipped: "no article with image created" };
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

  return {
    ok: true,
    created: created.length,
    articles: created.map((c) => ({ title: c.title, slug: c.slug, category: c.category })),
    instagramConfigured: isInstagramConfigured(),
    instagram,
    errors: errors.slice(0, 10),
    tookMs: Date.now() - started,
  };
}
