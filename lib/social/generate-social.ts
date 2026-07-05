// Builds and publishes Instagram content for the day, driven by saved themes
// (./themes.ts) and the 2-week rotating look (./rotation.ts).
//
// Engagement features:
//  - Reels (9:16 motion video) — the biggest reach/like driver
//  - Hooks + CTAs in captions; hashtags moved to the first comment
//  - Story teasers
//  - Every post is logged to SocialPost so the insights loop can learn what works
//  - Posts can be fired one-at-a-time across IST peak times (runSocialSlot)
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { geminiJson } from "@/lib/gemini";
import { generateAndHostImage } from "@/lib/gemini-image";
import { getAccountStats, getMediaInsights, postCarouselToInstagram, postReel, postStory, postToInstagram, type IgPostResult } from "@/lib/instagram";
import { isFacebookConfigured, postToFacebookPage } from "@/lib/facebook";
import { getThemeForDate, type Theme } from "@/lib/social/themes";
import { overlayUrl, publicIdFromUrl } from "@/lib/social/overlay";
import { buildReelVideo, primeReel } from "@/lib/social/reel";
import { accentFor, getStylePack, type StylePack } from "@/lib/social/rotation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const BRAND_TAGS = ["#news", "#indianews", "#india", "#headlinesdaily", "#dailynews", "#breakingnews"];

// Light, non-spammy calls-to-action that nudge likes/saves/comments.
const CTAS = [
  "Do you agree? Tell us below 👇",
  "Save this to read later 🔖",
  "Follow for daily India headlines.",
  "What's your take? 💬",
  "Tag someone who should see this.",
  "Double-tap if this matters to you.",
];

export interface SocialResult {
  ok: boolean;
  label: string;
  kind: string; // feed | carousel | reel | story
  format: string;
  slides: number;
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
  videoUrl?: string;
  coverUrl?: string; // a 4:5 still used for Facebook cross-post + Story share
  caption: string;
  firstComment?: string;
  usedSlugs: string[];
  errors: string[];
}

const articleSelect = {
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featuredImage: true,
  category: { select: { name: true, slug: true } },
} as const;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function trimWords(text: string, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  return words.length <= max ? words.join(" ") : words.slice(0, max).join(" ") + "...";
}
function slugTag(s: string): string {
  return `#${s.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
}
function pickCta(seed: number): string {
  return CTAS[seed % CTAS.length];
}

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

async function fetchThemeArticles(theme: Theme, limit: number, ignoreCategory = false): Promise<Article[]> {
  const since = new Date(Date.now() - theme.withinDays * 86400_000);
  return mapArticles(
    await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: since },
        ...(ignoreCategory || !theme.categorySlugs?.length ? {} : { category: { slug: { in: theme.categorySlugs } } }),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: articleSelect,
    })
  );
}

/** Recent published articles not yet posted to Instagram, most-recent first, category-diverse. */
async function fetchUnposted(limit: number, withinDays = 3): Promise<Article[]> {
  const since = new Date(Date.now() - withinDays * 86400_000);
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since }, igPostedAt: null },
    orderBy: { publishedAt: "desc" },
    take: limit * 4,
    select: articleSelect,
  });
  const all = mapArticles(rows);
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
  const prompt = [theme.imagePrompt, topic ? `The story is about: ${topic}.` : "", style.imageStyle].filter(Boolean).join(" ");
  const img = await generateAndHostImage(prompt, "4:5");
  return img?.publicId ?? null;
}

function captionBody(body: string, ctaSeed: number, link?: string): string {
  return [body.trim(), "", pickCta(ctaSeed), link ? `\nRead more: ${link}` : APP_URL ? `\nMore at ${APP_URL}` : ""]
    .filter((l) => l !== "")
    .join("\n")
    .slice(0, 2100);
}
function hashtagComment(tags: string[]): string {
  return Array.from(new Set(tags)).join(" ").slice(0, 2000);
}

// ── Post recording (feeds the insights learning loop) ───────────────────────
async function record(res: IgPostResult, meta: { kind: string; format: string; theme?: string; style?: string; articleSlug?: string }) {
  const id = (res as { id?: string }).id;
  if (!res.posted || !id) return;
  try {
    await prisma.socialPost.create({
      data: {
        igMediaId: id,
        kind: meta.kind,
        format: meta.format,
        theme: meta.theme ?? null,
        style: meta.style ?? null,
        articleSlug: meta.articleSlug ?? null,
        slotHour: new Date().getUTCHours(),
      },
    });
  } catch {
    /* non-fatal */
  }
  if (meta.articleSlug) {
    await prisma.article.updateMany({ where: { slug: meta.articleSlug }, data: { igPostedAt: new Date() } }).catch(() => {});
  }
}

// ── Theme post ───────────────────────────────────────────────────────────────
async function buildThemePost(theme: Theme, date: Date, style: StylePack): Promise<PostDraft> {
  const errors: string[] = [];
  const usedSlugs: string[] = [];
  const accent = accentFor(style, 0, date);
  let slideUrls: string[] = [];
  let cap = "";

  if (theme.style === "motivation") {
    const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(`${theme.copyPrompt}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`);
    const pid = await coverPublicId(theme, style);
    if (pid && copy) {
      slideUrls = [overlayUrl(pid, { kicker: theme.kicker, hook: copy.hook, sub: copy.sub, accent })];
      cap = captionBody(copy.caption, 0);
    } else errors.push("motivation build failed");
  } else if (theme.style === "article-single") {
    let arts = await fetchThemeArticles(theme, 1);
    if (!arts.length) arts = await fetchThemeArticles(theme, 1, true);
    const a = arts[0];
    if (a) {
      usedSlugs.push(a.slug);
      const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(`${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 400)}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`);
      const pid = (await toPublicId(a.featuredImage)) || (await coverPublicId(theme, style, a.title));
      if (pid) {
        slideUrls = [overlayUrl(pid, { kicker: theme.kicker, hook: copy?.hook || trimWords(a.title, 9), sub: copy?.sub, accent })];
        cap = captionBody(copy?.caption || a.excerpt || a.title, 0, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
      } else errors.push("article-single image failed");
    } else errors.push("no article for article-single");
  } else if (theme.style === "headlines") {
    let arts = await fetchThemeArticles(theme, theme.slides - 1);
    if (arts.length < 2) arts = await fetchThemeArticles(theme, theme.slides - 1, true);
    if (arts.length >= 2) {
      const copy = await geminiJson<{ coverHook: string; caption: string }>(`${theme.copyPrompt}\n\nHEADLINES:\n${arts.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}\n\nReturn ONLY JSON: {"coverHook": string, "caption": string}`);
      const slides: string[] = [];
      const coverPid = await coverPublicId(theme, style);
      if (coverPid) slides.push(overlayUrl(coverPid, { kicker: theme.kicker, hook: copy?.coverHook || theme.name, sub: "Swipe →", accent }));
      for (const a of arts) {
        const pid = await toPublicId(a.featuredImage);
        if (!pid) continue;
        usedSlugs.push(a.slug);
        slides.push(overlayUrl(pid, { kicker: a.categoryName, hook: trimWords(a.title, 12), accent }));
      }
      slideUrls = slides;
      cap = captionBody(copy?.caption || `${theme.name}: the stories that mattered.`, 0);
    } else errors.push("not enough articles for headlines");
  } else if (theme.style === "explainer") {
    let arts = await fetchThemeArticles(theme, 1);
    if (!arts.length) arts = await fetchThemeArticles(theme, 1, true);
    const a = arts[0];
    if (a) {
      usedSlugs.push(a.slug);
      const copy = await geminiJson<{ coverHook: string; keyPoints: string[]; caption: string }>(`${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nBODY: ${stripHtml(a.content).slice(0, 1200)}\n\nReturn ONLY JSON: {"coverHook": string, "keyPoints": string[], "caption": string}`);
      const slides: string[] = [];
      const coverPid = (await coverPublicId(theme, style, a.title)) || (await toPublicId(a.featuredImage));
      if (coverPid) slides.push(overlayUrl(coverPid, { kicker: theme.kicker, hook: copy?.coverHook || trimWords(a.title, 8), sub: "Swipe →", accent }));
      const points = (copy?.keyPoints || []).slice(0, theme.slides - 1);
      for (let i = 0; i < points.length; i++) {
        if (!coverPid) break;
        slides.push(overlayUrl(coverPid, { kicker: `${i + 1} / ${points.length}`, hook: points[i], accent }));
      }
      slideUrls = slides;
      cap = captionBody(copy?.caption || a.excerpt || a.title, 0, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
    } else errors.push("no article for explainer");
  }

  return { slideUrls, coverUrl: slideUrls[0], caption: cap, firstComment: hashtagComment([...BRAND_TAGS, ...theme.hashtags]), usedSlugs, errors };
}

// ── Single top-story image post ──────────────────────────────────────────────
async function buildArticlePost(a: Article, accent: string, style: StylePack, ctaSeed: number): Promise<PostDraft> {
  const errors: string[] = [];
  const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
    `Write a punchy, scroll-stopping Instagram post for this Indian news story.\nARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 350)}\n\nReturn ONLY JSON: {"hook": max 9 words, "sub": max 12 words, "caption": 2-3 sentences}`
  );
  const pid = (await toPublicId(a.featuredImage)) || (await generateAndHostImage(`Editorial news image about: ${a.title}. ${style.imageStyle} No text, no logos, no watermark.`, "4:5"))?.publicId;
  if (!pid) {
    errors.push(`article post image failed: ${a.slug}`);
    return { slideUrls: [], caption: "", usedSlugs: [a.slug], errors };
  }
  const slide = overlayUrl(pid, { kicker: a.categoryName, hook: copy?.hook || trimWords(a.title, 9), sub: copy?.sub, accent });
  const cap = captionBody(copy?.caption || a.excerpt || a.title, ctaSeed, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
  return { slideUrls: [slide], coverUrl: slide, caption: cap, firstComment: hashtagComment([...BRAND_TAGS, slugTag(a.categorySlug)]), usedSlugs: [a.slug], errors };
}

// ── Reel (9:16 motion video) ─────────────────────────────────────────────────
async function buildReelPost(a: Article, accent: string, style: StylePack, ctaSeed: number): Promise<PostDraft> {
  const errors: string[] = [];
  const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
    `Write a punchy Instagram REEL cover for this Indian news story.\nARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 350)}\n\nReturn ONLY JSON: {"hook": max 8 words, "sub": max 10 words, "caption": 2-3 sentences}`
  );
  const pid = (await toPublicId(a.featuredImage)) || (await generateAndHostImage(`Editorial news image about: ${a.title}. ${style.imageStyle} No text.`, "4:5"))?.publicId;
  if (!pid) {
    errors.push(`reel image failed: ${a.slug}`);
    return { slideUrls: [], caption: "", usedSlugs: [a.slug], errors };
  }
  const video = await buildReelVideo(pid, { kicker: a.categoryName, hook: copy?.hook || trimWords(a.title, 8), sub: copy?.sub, accent });
  if (!video) {
    errors.push(`reel video build failed: ${a.slug}`);
    return { slideUrls: [], caption: "", usedSlugs: [a.slug], errors };
  }
  await primeReel(video); // pre-generate so IG's fetch doesn't time out
  const cover = overlayUrl(pid, { kicker: a.categoryName, hook: copy?.hook || trimWords(a.title, 8), sub: copy?.sub, accent });
  const cap = captionBody(copy?.caption || a.excerpt || a.title, ctaSeed, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
  return { slideUrls: [], videoUrl: video, coverUrl: cover, caption: cap, firstComment: hashtagComment([...BRAND_TAGS, slugTag(a.categorySlug), "#reels", "#reelsindia"]), usedSlugs: [a.slug], errors };
}

// ── Story teaser (plain image; API can't do poll/link stickers) ──────────────
async function buildStory(a: Article, accent: string): Promise<PostDraft> {
  const pid = await toPublicId(a.featuredImage);
  if (!pid) return { slideUrls: [], caption: "", usedSlugs: [], errors: ["story image failed"] };
  const slide = overlayUrl(pid, { kicker: "IN THE NEWS", hook: trimWords(a.title, 10), sub: "Read the full story — link in bio", accent });
  return { slideUrls: [slide], caption: "", usedSlugs: [], errors: [] };
}

async function finalize(label: string, kind: string, format: string, draft: PostDraft, meta: { theme?: string; style?: string; articleSlug?: string; alsoStory?: boolean }, dryRun?: boolean): Promise<SocialResult> {
  const hasMedia = draft.videoUrl || draft.slideUrls.length;
  if (!hasMedia) {
    return { ok: false, label, kind, format, slides: 0, instagram: { skipped: "nothing to post" }, errors: draft.errors };
  }
  let instagram: unknown;
  if (dryRun) {
    instagram = { skipped: "dry run", media: draft.videoUrl || draft.slideUrls, facebook: isFacebookConfigured() ? "would cross-post" : "not configured", story: meta.alsoStory ? "would share to story" : undefined };
    return { ok: true, label, kind, format, slides: draft.slideUrls.length || 1, instagram, errors: draft.errors };
  }
  let res: IgPostResult;
  if (kind === "reel" && draft.videoUrl) {
    res = await postReel({ videoUrl: draft.videoUrl, caption: draft.caption, firstComment: draft.firstComment });
  } else if (kind === "story") {
    res = await postStory({ imageUrl: draft.slideUrls[0] });
  } else if (draft.slideUrls.length > 1) {
    res = await postCarouselToInstagram({ imageUrls: draft.slideUrls, caption: draft.caption, firstComment: draft.firstComment });
  } else {
    res = await postToInstagram({ imageUrl: draft.slideUrls[0], caption: draft.caption, firstComment: draft.firstComment });
  }
  await record(res, { kind, format, theme: meta.theme, style: meta.style, articleSlug: meta.articleSlug });

  // Best-effort extra reach surfaces (never fail the main post over these).
  if (res.posted && kind !== "story" && draft.coverUrl) {
    if (isFacebookConfigured()) {
      await postToFacebookPage({ imageUrl: draft.coverUrl, caption: draft.caption }).catch(() => {});
    }
    if (meta.alsoStory) {
      await postStory({ imageUrl: draft.coverUrl }).catch(() => {});
    }
  }
  return { ok: Boolean(res.posted), label, kind, format, slides: draft.slideUrls.length || 1, instagram: res, errors: draft.errors };
}

// ── Public entry points ──────────────────────────────────────────────────────

/** Single themed post (API route / manual). */
export async function generateSocialPost(date = new Date(), opts: { dryRun?: boolean; alsoStory?: boolean } = {}): Promise<SocialResult> {
  const style = getStylePack(date);
  const theme = getThemeForDate(date);
  const draft = await buildThemePost(theme, date, style);
  return finalize(theme.name, theme.slides > 1 ? "carousel" : "feed", theme.style, draft, { theme: theme.id, style: style.name, articleSlug: draft.usedSlugs[0], alsoStory: opts.alsoStory }, opts.dryRun);
}

/** Full daily batch: themed post + 1 Reel + top-story posts + a Story teaser. */
export async function generateDailySocialPosts(date = new Date(), opts: { count?: number; dryRun?: boolean } = {}): Promise<DailySocialResult> {
  const started = Date.now();
  const count = Math.max(1, opts.count ?? 5);
  const style = getStylePack(date);
  const theme = getThemeForDate(date);
  const posts: SocialResult[] = [];
  const used = new Set<string>();

  // 1) Themed post.
  const themeDraft = await buildThemePost(theme, date, style);
  themeDraft.usedSlugs.forEach((s) => used.add(s));
  posts.push(await finalize(theme.name, theme.slides > 1 ? "carousel" : "feed", theme.style, themeDraft, { theme: theme.id, style: style.name, articleSlug: themeDraft.usedSlugs[0] }, opts.dryRun));

  const candidates = await fetchUnposted(count + 4, 3);
  let i = 1;

  // 2) One Reel from the freshest unposted story.
  const reelArt = candidates.find((a) => !used.has(a.slug));
  if (reelArt && posts.length < count) {
    used.add(reelArt.slug);
    const draft = await buildReelPost(reelArt, accentFor(style, i, date), style, i);
    posts.push(await finalize(`Reel · ${reelArt.categoryName}`, "reel", "reel", draft, { style: style.name, articleSlug: reelArt.slug }, opts.dryRun));
    i++;
  }

  // 3) Remaining slots: single top-story image posts.
  for (const a of candidates) {
    if (posts.length >= count) break;
    if (used.has(a.slug)) continue;
    used.add(a.slug);
    const draft = await buildArticlePost(a, accentFor(style, i, date), style, i);
    posts.push(await finalize(`Top Story · ${a.categoryName}`, "feed", "article-single", draft, { style: style.name, articleSlug: a.slug }, opts.dryRun));
    i++;
  }

  // 4) Story teaser (extra, not counted toward feed `count`).
  const storyArt = candidates[0];
  if (storyArt) {
    const draft = await buildStory(storyArt, accentFor(style, 0, date));
    posts.push(await finalize("Story teaser", "story", "story", draft, { style: style.name }, opts.dryRun));
  }

  const posted = posts.filter((p) => p.ok).length;
  return { ok: posted > 0, date: date.toISOString().slice(0, 10), stylePack: style.name, posted, requested: count, posts, tookMs: Date.now() - started };
}

/**
 * Post ONE item — used by the scheduler to spread posts across IST peak times.
 * action: theme | reel | article | story  (defaults chosen by UTC hour).
 */
export async function runSocialSlot(action?: string, date = new Date(), opts: { dryRun?: boolean } = {}): Promise<SocialResult> {
  const style = getStylePack(date);
  const resolved = action || slotForHour(date.getUTCHours());

  if (resolved === "theme") return generateSocialPost(date, { ...opts, alsoStory: true });

  const candidates = await fetchUnposted(6, 3);
  const a = candidates[0];
  if (!a) return { ok: false, label: resolved, kind: resolved, format: resolved, slides: 0, instagram: { skipped: "no unposted article" }, errors: [] };

  if (resolved === "reel") {
    const draft = await buildReelPost(a, accentFor(style, 1, date), style, 1);
    return finalize(`Reel · ${a.categoryName}`, "reel", "reel", draft, { style: style.name, articleSlug: a.slug, alsoStory: true }, opts.dryRun);
  }
  if (resolved === "story") {
    const draft = await buildStory(a, accentFor(style, 0, date));
    return finalize("Story teaser", "story", "story", draft, { style: style.name }, opts.dryRun);
  }
  // default: article
  const draft = await buildArticlePost(a, accentFor(style, 2, date), style, 2);
  return finalize(`Top Story · ${a.categoryName}`, "feed", "article-single", draft, { style: style.name, articleSlug: a.slug, alsoStory: true }, opts.dryRun);
}

/** Map a UTC hour to a post type across the Indian day (IST = UTC+5:30). */
function slotForHour(utcHour: number): string {
  if (utcHour < 4) return "theme"; // ~7:30-9:30 IST morning
  if (utcHour < 8) return "reel"; // ~10:30-13:00 IST (wide, since cron can run late)
  if (utcHour < 14) return "article"; // ~13:30 IST midday
  return "story"; // ~21:00 IST night (+ articles below)
}

/** Refresh cached insights for recently-posted media and log a performance summary. */
export async function refreshInsightsAndSummarize(withinDays = 14): Promise<{ updated: number; summary: Record<string, { posts: number; avgEngagement: number }>; followers?: number }> {
  // Capture today's follower snapshot (IST day) so we can chart growth.
  let followers: number | undefined;
  const stats = await getAccountStats();
  if (stats) {
    followers = stats.followers;
    const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST date
    await prisma.accountSnapshot
      .upsert({ where: { day }, create: { day, followers: stats.followers, follows: stats.follows, mediaCount: stats.mediaCount }, update: { followers: stats.followers, follows: stats.follows, mediaCount: stats.mediaCount } })
      .catch(() => {});
  }

  const since = new Date(Date.now() - withinDays * 86400_000);
  const recent = await prisma.socialPost.findMany({ where: { postedAt: { gte: since } } });
  let updated = 0;
  for (const p of recent) {
    const ins = await getMediaInsights(p.igMediaId);
    if (!ins) continue;
    await prisma.socialPost.update({
      where: { id: p.id },
      data: { likes: ins.likes ?? p.likes, reach: ins.reach ?? p.reach, saved: ins.saved ?? p.saved, comments: ins.comments ?? p.comments, shares: ins.shares ?? p.shares, fetchedAt: new Date() },
    });
    updated++;
  }
  const all = await prisma.socialPost.findMany({ where: { postedAt: { gte: since } } });
  const byFormat: Record<string, { posts: number; total: number }> = {};
  for (const p of all) {
    const eng = (p.likes ?? 0) + (p.saved ?? 0) + (p.shares ?? 0) + (p.comments ?? 0);
    const key = p.format || p.kind;
    byFormat[key] = byFormat[key] || { posts: 0, total: 0 };
    byFormat[key].posts++;
    byFormat[key].total += eng;
  }
  const summary: Record<string, { posts: number; avgEngagement: number }> = {};
  for (const [k, v] of Object.entries(byFormat)) summary[k] = { posts: v.posts, avgEngagement: v.posts ? Math.round((v.total / v.posts) * 10) / 10 : 0 };
  return { updated, summary, followers };
}
