// Builds and publishes themed Instagram content for a given date, driven by the
// saved templates in ./themes.ts and the 2-week rotating look in ./rotation.ts.
//
// A day's batch = 1 themed post (the day's calendar theme) + N top-story posts,
// each with its own hook overlay and a rotating accent color so nothing repeats.
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { geminiJson } from "@/lib/gemini";
import { generateAndHostImage } from "@/lib/gemini-image";
import { postCarouselToInstagram, postToInstagram } from "@/lib/instagram";
import { fullHashtags, getThemeForDate, type Theme } from "@/lib/social/themes";
import { overlayUrl, publicIdFromUrl } from "@/lib/social/overlay";
import { accentFor, getStylePack, type StylePack } from "@/lib/social/rotation";

const BRAND = process.env.IG_BRAND_HANDLE || "@yournishsuri";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const BRAND_TAGS = ["#news", "#headlinesdaily", "#dailynews"];

export interface SocialResult {
  ok: boolean;
  label: string;
  style: string;
  slides: number;
  slideUrls: string[];
  caption: string;
  instagram: unknown;
  errors: string[];
}

export interface DailySocialResult {
  ok: boolean;
  date: string;
  stylePack: string;
  posted: number;
  requested: number;
  posts: SocialResult[];
  tookMs: number;
}

interface Article {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryName: string;
  categorySlug: string;
}

interface PostDraft {
  slideUrls: string[];
  caption: string;
  usedSlugs: string[];
  errors: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function trimWords(text: string, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  return words.length <= max ? words.join(" ") : words.slice(0, max).join(" ") + "…";
}
function slugTag(s: string): string {
  return `#${s.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
}

async function fetchArticles(theme: Theme, limit: number, ignoreCategory = false): Promise<Article[]> {
  const since = new Date(Date.now() - theme.withinDays * 86400_000);
  return mapArticles(
    await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: since },
        ...(ignoreCategory || !theme.categorySlugs?.length
          ? {}
          : { category: { slug: { in: theme.categorySlugs } } }),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: articleSelect,
    })
  );
}

async function fetchRecentDiverse(limit: number, withinDays: number): Promise<Article[]> {
  const since = new Date(Date.now() - withinDays * 86400_000);
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: limit * 4,
    select: articleSelect,
  });
  const all = mapArticles(rows);
  // Greedily prefer category diversity.
  const picked: Article[] = [];
  const seenCats = new Set<string>();
  for (const a of all) {
    if (picked.length >= limit) break;
    if (seenCats.has(a.categorySlug)) continue;
    seenCats.add(a.categorySlug);
    picked.push(a);
  }
  for (const a of all) {
    if (picked.length >= limit) break;
    if (!picked.includes(a)) picked.push(a);
  }
  return picked;
}

const articleSelect = {
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featuredImage: true,
  category: { select: { name: true, slug: true } },
} as const;

function mapArticles(rows: Array<{ title: string; slug: string; excerpt: string | null; content: string; featuredImage: string | null; category: { name: string; slug: string } | null }>): Article[] {
  return rows.map((r) => ({
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    featuredImage: r.featuredImage,
    categoryName: r.category?.name ?? "News",
    categorySlug: r.category?.slug ?? "news",
  }));
}

async function toPublicId(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.includes("res.cloudinary.com")) return publicIdFromUrl(imageUrl);
  try {
    return (await uploadImage(imageUrl, "daily-news/social")).publicId;
  } catch {
    return null;
  }
}

async function coverPublicId(theme: Theme, style: StylePack, topic?: string): Promise<string | null> {
  const prompt = [theme.imagePrompt, topic ? `The story is about: ${topic}.` : "", style.imageStyle]
    .filter(Boolean)
    .join(" ");
  const img = await generateAndHostImage(prompt, "4:5");
  return img?.publicId ?? null;
}

function caption(body: string, hashtags: string[], link?: string): string {
  return [body.trim(), "", link ? `Read more: ${link}` : APP_URL ? `More at ${APP_URL}` : "", "", Array.from(new Set(hashtags)).join(" ")]
    .filter((l) => l !== "")
    .join("\n")
    .slice(0, 2200);
}

// ---------------------------------------------------------------------------
// Theme post (the day's calendar theme)
// ---------------------------------------------------------------------------
async function buildThemePost(theme: Theme, date: Date, style: StylePack): Promise<PostDraft> {
  const errors: string[] = [];
  const usedSlugs: string[] = [];
  const accent = accentFor(style, 0, date);
  let slideUrls: string[] = [];
  let cap = "";

  if (theme.style === "motivation") {
    const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
      `${theme.copyPrompt}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`
    );
    const pid = await coverPublicId(theme, style);
    if (pid && copy) {
      slideUrls = [overlayUrl(pid, { kicker: theme.kicker, hook: copy.hook, sub: copy.sub, brand: BRAND, accent })];
      cap = caption(copy.caption, [...BRAND_TAGS, ...theme.hashtags]);
    } else errors.push("motivation build failed");
  } else if (theme.style === "article-single") {
    let arts = await fetchArticles(theme, 1);
    if (!arts.length) arts = await fetchArticles(theme, 1, true);
    const a = arts[0];
    if (a) {
      usedSlugs.push(a.slug);
      const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
        `${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 400)}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`
      );
      const pid = (await toPublicId(a.featuredImage)) || (await coverPublicId(theme, style, a.title));
      if (pid) {
        slideUrls = [
          overlayUrl(pid, { kicker: theme.kicker, hook: copy?.hook || trimWords(a.title, 9), sub: copy?.sub, brand: BRAND, accent }),
        ];
        cap = caption(copy?.caption || a.excerpt || a.title, [...BRAND_TAGS, ...theme.hashtags], APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
      } else errors.push("article-single image failed");
    } else errors.push("no article for article-single");
  } else if (theme.style === "headlines") {
    let arts = await fetchArticles(theme, theme.slides - 1);
    if (arts.length < 2) arts = await fetchArticles(theme, theme.slides - 1, true);
    if (arts.length >= 2) {
      const copy = await geminiJson<{ coverHook: string; caption: string }>(
        `${theme.copyPrompt}\n\nHEADLINES:\n${arts.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}\n\nReturn ONLY JSON: {"coverHook": string, "caption": string}`
      );
      const slides: string[] = [];
      const coverPid = await coverPublicId(theme, style);
      if (coverPid) {
        slides.push(overlayUrl(coverPid, { kicker: theme.kicker, hook: copy?.coverHook || theme.name, sub: "Swipe →", brand: BRAND, accent }));
      }
      for (const a of arts) {
        const pid = await toPublicId(a.featuredImage);
        if (!pid) continue;
        usedSlugs.push(a.slug);
        slides.push(overlayUrl(pid, { kicker: a.categoryName, hook: trimWords(a.title, 12), brand: BRAND, accent }));
      }
      slideUrls = slides;
      cap = caption(copy?.caption || `${theme.name}: the stories that mattered.`, [...BRAND_TAGS, ...theme.hashtags]);
    } else errors.push("not enough articles for headlines");
  } else if (theme.style === "explainer") {
    let arts = await fetchArticles(theme, 1);
    if (!arts.length) arts = await fetchArticles(theme, 1, true);
    const a = arts[0];
    if (a) {
      usedSlugs.push(a.slug);
      const copy = await geminiJson<{ coverHook: string; keyPoints: string[]; caption: string }>(
        `${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nBODY: ${stripHtml(a.content).slice(0, 1200)}\n\nReturn ONLY JSON: {"coverHook": string, "keyPoints": string[], "caption": string}`
      );
      const slides: string[] = [];
      const coverPid = (await coverPublicId(theme, style, a.title)) || (await toPublicId(a.featuredImage));
      if (coverPid) slides.push(overlayUrl(coverPid, { kicker: theme.kicker, hook: copy?.coverHook || trimWords(a.title, 8), sub: "Swipe →", brand: BRAND, accent }));
      const points = (copy?.keyPoints || []).slice(0, theme.slides - 1);
      for (let i = 0; i < points.length; i++) {
        const pid = (await coverPublicId(theme, style, a.title)) || coverPid;
        if (!pid) continue;
        slides.push(overlayUrl(pid, { kicker: `${i + 1} / ${points.length}`, hook: points[i], brand: BRAND, accent }));
      }
      slideUrls = slides;
      cap = caption(copy?.caption || a.excerpt || a.title, [...BRAND_TAGS, ...theme.hashtags], APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
    } else errors.push("no article for explainer");
  }

  return { slideUrls, caption: cap, usedSlugs, errors };
}

// ---------------------------------------------------------------------------
// Top-story single post
// ---------------------------------------------------------------------------
async function buildArticlePost(a: Article, accent: string, style: StylePack): Promise<PostDraft> {
  const errors: string[] = [];
  const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
    `Write a punchy, scroll-stopping Instagram post for this news story. No hype, no clickbait lies.\n` +
      `ARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 350)}\n\n` +
      `Return ONLY JSON: {"hook": max 9 words, "sub": max 12 words, "caption": 2-3 sentences}`
  );
  const pid = (await toPublicId(a.featuredImage)) || (await generateAndHostImage(`Editorial news image about: ${a.title}. ${style.imageStyle} No text, no logos, no watermark.`, "4:5"))?.publicId;
  if (!pid) {
    errors.push(`article post image failed: ${a.slug}`);
    return { slideUrls: [], caption: "", usedSlugs: [a.slug], errors };
  }
  const slide = overlayUrl(pid, {
    kicker: a.categoryName,
    hook: copy?.hook || trimWords(a.title, 9),
    sub: copy?.sub,
    brand: BRAND,
    accent,
  });
  const cap = caption(
    copy?.caption || a.excerpt || a.title,
    [...BRAND_TAGS, slugTag(a.categorySlug), "#breakingnews"],
    APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined
  );
  return { slideUrls: [slide], caption: cap, usedSlugs: [a.slug], errors };
}

async function finalize(label: string, style: string, draft: PostDraft, dryRun?: boolean): Promise<SocialResult> {
  if (!draft.slideUrls.length) {
    return { ok: false, label, style, slides: 0, slideUrls: [], caption: draft.caption, instagram: { skipped: "nothing to post" }, errors: draft.errors };
  }
  const instagram = dryRun
    ? { skipped: "dry run" }
    : draft.slideUrls.length === 1
      ? await postToInstagram({ imageUrl: draft.slideUrls[0], caption: draft.caption })
      : await postCarouselToInstagram({ imageUrls: draft.slideUrls, caption: draft.caption });
  const ok = dryRun ? true : Boolean((instagram as { posted?: boolean }).posted);
  return { ok, label, style, slides: draft.slideUrls.length, slideUrls: draft.slideUrls, caption: draft.caption, instagram, errors: draft.errors };
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

/** Single themed post (used by the API route / manual single-post trigger). */
export async function generateSocialPost(date = new Date(), opts: { dryRun?: boolean } = {}): Promise<SocialResult> {
  const style = getStylePack(date);
  const theme = getThemeForDate(date);
  const draft = await buildThemePost(theme, date, style);
  return finalize(theme.name, theme.style, draft, opts.dryRun);
}

/** A full day's batch: 1 themed post + (count-1) top-story posts, all posted to Instagram. */
export async function generateDailySocialPosts(
  date = new Date(),
  opts: { count?: number; dryRun?: boolean } = {}
): Promise<DailySocialResult> {
  const started = Date.now();
  const count = Math.max(1, opts.count ?? 5);
  const style = getStylePack(date);
  const theme = getThemeForDate(date);
  const posts: SocialResult[] = [];
  const usedSlugs = new Set<string>();

  // 1) Themed post.
  const themeDraft = await buildThemePost(theme, date, style);
  themeDraft.usedSlugs.forEach((s) => usedSlugs.add(s));
  posts.push(await finalize(theme.name, theme.style, themeDraft, opts.dryRun));

  // 2) Top-story posts (distinct, category-diverse).
  const candidates = await fetchRecentDiverse((count - 1) * 2 + 4, 3);
  let i = 1;
  for (const a of candidates) {
    if (posts.length >= count) break;
    if (usedSlugs.has(a.slug)) continue;
    usedSlugs.add(a.slug);
    const draft = await buildArticlePost(a, accentFor(style, i, date), style);
    posts.push(await finalize(`Top Story · ${a.categoryName}`, "article-single", draft, opts.dryRun));
    i++;
  }

  const posted = posts.filter((p) => p.ok).length;
  return {
    ok: posted > 0,
    date: date.toISOString().slice(0, 10),
    stylePack: style.name,
    posted,
    requested: count,
    posts,
    tookMs: Date.now() - started,
  };
}
