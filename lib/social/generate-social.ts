// Builds and publishes Instagram content for the day, driven by saved themes
// (./themes.ts) and the 2-week rotating look (./rotation.ts).
//
// Engagement features:
//  - Reels (9:16 motion video) — the biggest reach/like driver
//  - Hooks + CTAs in captions; hashtags moved to the first comment
//  - Story teasers
//  - Every post is logged to SocialPost so the insights loop can learn what works
//  - Posts can be fired one-at-a-time across IST peak times (runSocialSlot)
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { estimateReadingTime } from "@/lib/utils";
import { uploadImage, cloudinary } from "@/lib/cloudinary";
import { geminiJson } from "@/lib/gemini";
import { generateAndHostImage } from "@/lib/gemini-image";
import { getAccountStats, getMediaInsights, postCarouselToInstagram, postReel, postStory, postToInstagram, type IgPostResult } from "@/lib/instagram";
import { isFacebookConfigured, postToFacebookPage } from "@/lib/facebook";
import { getThemeForDate, type Theme } from "@/lib/social/themes";
import { overlayUrl, sceneStillUrl, sceneBgUrl, captionStripUrl, storyUrl, publicIdFromUrl } from "@/lib/social/overlay";
import { buildReelVideo, primeReel } from "@/lib/social/reel";
import { getArchiveStory } from "@/lib/social/archive";
import { synthesizeNarration } from "@/lib/social/tts";
import { renderNarratedReel } from "@/lib/social/ffmpeg-reel";
import { ensureCaptionBase } from "@/lib/social/caption-base";
import { accentFor, getStylePack, type StylePack } from "@/lib/social/rotation";
import { craftHashtags } from "@/lib/social/hashtags";
import { biasByTrends } from "@/lib/social/trends";

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

/** Most-recent unposted published article within given categories (for the politics reel). */
async function fetchArticleByCategory(slugs: string[], exclude: Set<string>, withinDays = 7): Promise<Article | null> {
  const since = new Date(Date.now() - withinDays * 86400_000);
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since }, igPostedAt: null, category: { slug: { in: slugs } } },
    orderBy: { publishedAt: "desc" },
    take: 12,
    select: articleSelect,
  });
  return mapArticles(rows).find((a) => !exclude.has(a.slug)) ?? null;
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
  return { slideUrls: [slide], coverUrl: slide, caption: cap, firstComment: await craftHashtags(a.title, [a.categorySlug]), usedSlugs: [a.slug], errors };
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
  return { slideUrls: [], videoUrl: video, coverUrl: cover, caption: cap, firstComment: await craftHashtags(a.title, [a.categorySlug, "reels", "reelsindia"]), usedSlugs: [a.slug], errors };
}

// ── Narrated storytelling Reel from a recent news article ────────────────────
// Same pipeline as the history reel (voiceover + one captioned image per beat,
// stitched by ffmpeg) but sourced from a live story. Falls back to the silent
// single-image reel if the voiceover / ffmpeg assembly is unavailable.
const NEWS_REEL_STYLE =
  "Cinematic, photorealistic, editorial news photography; clean composition, natural lighting, shallow depth of field, modern documentary look.";

// When a story IS about India/Indians, force authentically Indian, region-true
// people (the image model otherwise defaults to generic Western faces).
const INDIAN_PEOPLE_DIRECTIVE =
  "If any people appear, they must be authentically Indian and true to the story's region, community and language group (for example Gujarati people for a Gujarat story, Punjabi people for a Punjab story, Tamil people for a Tamil Nadu story, Bengali people for a West Bengal story) — natural Indian faces, skin tones, hair, clothing and setting. Never depict white or Western-looking people.";

// When a story is NOT about India (e.g. a Belgium–USA match, a US election), the
// people/place must match the ACTUAL story — never substitute Indian faces or
// Indian settings into a foreign story.
const NEUTRAL_PEOPLE_DIRECTIVE =
  "Depict any people, teams, uniforms, flags and locations truthfully to the story's ACTUAL nationality, ethnicity and place as described in the scene. Do NOT substitute Indian people, Indian teams or Indian locations into a story that is set elsewhere or about non-Indians.";

async function buildNarratedNewsReel(a: Article, accent: string, ctaSeed: number, seed: number, lang: "en" | "hi" = "en"): Promise<PostDraft> {
  const story = await geminiJson<{ kicker: string; takeaway: string; caption: string; indiaStory: boolean; scenes: { text: string; image: string }[] }>(
    `You are a top Indian Instagram Reels scriptwriter. Your reels go viral because a viewer INSTANTLY understands what the story is about and feels they must watch to the end — and can repeat the main point afterwards.\n` +
      `Turn this ${a.categoryName} story into a narrated Reel.\n\n` +
      `HEADLINE: ${a.title}\nSUMMARY: ${a.excerpt || ""}\nARTICLE: ${stripHtml(a.content).slice(0, 2500)}\n\n` +
      `STEP 1 — Decide the ONE thing a viewer must remember after watching (the "takeaway": a single, specific, plain-English sentence). Every beat must build toward it.\n\n` +
      `REELS PSYCHOLOGY (follow strictly — this is why past reels felt unclear):\n` +
      `- Beat 1 is THE HOOK and decides everything. In ONE line, make the SUBJECT unmistakable AND stop the scroll — a surprising fact, a real stake, or a sharp "what just happened". Name who/what it is about. NEVER a slow, generic intro.\n` +
      `- Beat 2: give the essential context in one plain line — what is happening and why now.\n` +
      `- Middle beats: deliver the key facts with CONCRETE specifics (real names, numbers, places, dates from the article). Each line should make the viewer want the next one.\n` +
      `- Final beat: state the takeaway clearly — the "so what / why it matters" — then a 2-3 word nudge to follow for more.\n` +
      `- Every sentence must be plain, concrete spoken language a normal person actually says. NO jargon, NO vague summaries, NO filler. If a line adds no new information, cut it.\n` +
      `- It must be fully understandable with the sound OFF (captions carry the story).\n` +
      `- Use ONLY facts from the article; never invent details.\n\n` +
      `OUTPUT:\n` +
      `- "indiaStory": true ONLY if the story is primarily about India, Indians or an Indian team/place; false for a foreign story (e.g. a Belgium vs USA match, a US election, a European summit).\n` +
      `- 5 beats. Each beat has:\n` +
      `   - "text": ONE spoken sentence, max ~14 words, clear and concrete. No hashtags/labels/emojis.\n` +
      `   - "image": a DISTINCT, photorealistic editorial scene for that beat. Use symbolic/contextual scenes (stadiums, crowds, maps, flags, documents, locations). Do NOT depict real, identifiable living politicians or private individuals. When a scene includes people, state the CORRECT nationality/region and attire for THIS story — e.g. for a Belgium vs USA football match, "Belgian and American players in their national kits"; for a Gujarat story, "Gujarati crowd in traditional dress in Ahmedabad". Match teams, kits, flags and settings to the real story. No text, no logos, no watermark.\n` +
      `- "kicker": a 2-4 word UPPERCASE label (e.g. "INDIAN POLITICS", "WORLD CUP", "BREAKING").\n` +
      `- "takeaway": the single-sentence core message from STEP 1.\n` +
      `- "caption": lead with the takeaway, then 1-2 punchy sentences for the Instagram caption.\n` +
      `Return ONLY JSON: {"kicker":"...","takeaway":"...","caption":"...","indiaStory":true|false,"scenes":[{"text":"...","image":"..."}]}`,
    0.6
  );

  const kicker = (story?.kicker || a.categoryName).toUpperCase().slice(0, 24);
  const cap = captionBody(story?.caption || a.excerpt || a.title, ctaSeed, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
  const firstComment = await craftHashtags(a.title, [a.categorySlug, "reels", "reelsindia"]);
  // Only force Indian faces/settings when the story is actually about India.
  const peopleDirective = story?.indiaStory === false ? NEUTRAL_PEOPLE_DIRECTIVE : INDIAN_PEOPLE_DIRECTIVE;

  // One distinct image per beat, generated sequentially (parallel trips the image
  // model's rate limit and they all fail).
  const beats: { caption: string; img: { url: string; publicId: string } }[] = [];
  for (const s of story?.scenes ?? []) {
    if (!s?.text || !s?.image) continue;
    const img = await generateAndHostImage(`${s.image}. ${NEWS_REEL_STYLE} ${peopleDirective} No text, no logos, no watermark.`, "4:5");
    if (img?.publicId) beats.push({ caption: s.text, img });
  }

  const assembled = await reelFromBeats(beats, kicker, accent, seed, lang);
  if (assembled) {
    return { slideUrls: [], videoUrl: assembled.videoUrl, coverUrl: assembled.coverUrl, caption: cap, firstComment, usedSlugs: [a.slug], errors: [] };
  }

  // Fallback: silent single-image reel from the article.
  console.log(`[news-reel] narrated assembly unavailable for ${a.slug}; falling back to silent reel`);
  return buildReelPost(a, accent, getStylePack(new Date()), ctaSeed);
}

// ── Publish the companion "longer read" article for an archive story ─────────
async function ensureHistoryCategory() {
  return prisma.category.upsert({
    where: { slug: "history" },
    update: {},
    create: { name: "History", slug: "history", description: "Stories from the past — Indian and world history.", sortOrder: 90 },
  });
}
async function ensureDeskAuthor() {
  return prisma.user.upsert({
    where: { email: "newsroom-ai@dailynews.com" },
    update: {},
    create: { email: "newsroom-ai@dailynews.com", name: "Lok Mandate Desk", role: "EDITOR" },
  });
}
async function archiveUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true }).slice(0, 80) || `story-${Date.now()}`;
  if (await prisma.article.findFirst({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  return slug;
}

/** Publishes the archive story as a full website article. Returns its slug, or null. */
async function publishArchiveArticle(story: { title: string; body: string; metaDescription: string; kicker: string }, imageUrl: string | null): Promise<string | null> {
  try {
    const [cat, author] = await Promise.all([ensureHistoryCategory(), ensureDeskAuthor()]);
    const slug = await archiveUniqueSlug(story.title);
    await prisma.article.create({
      data: {
        title: story.title,
        slug,
        content: story.body,
        excerpt: story.metaDescription.slice(0, 300),
        featuredImage: imageUrl,
        featuredImageAlt: story.title,
        status: "PUBLISHED",
        publishedAt: new Date(),
        readingTime: estimateReadingTime(story.body),
        metaTitle: story.title.slice(0, 60),
        metaDescription: story.metaDescription.slice(0, 160),
        authorId: author.id,
        categoryId: cat.id,
      },
    });
    return slug;
  } catch {
    return null;
  }
}

// ── Evergreen "story from the past" Reel (growth pillar) ─────────────────────
async function uploadReelFile(path: string): Promise<string | null> {
  try {
    const up = await cloudinary.uploader.upload(path, { resource_type: "video", folder: "daily-news/reels" });
    return up.secure_url || null;
  } catch {
    return null;
  }
}

/**
 * Shared reel assembly: narrate the beats (young-Indian-woman voiceover) and
 * stitch one captioned image per beat into a video with ffmpeg. Returns the
 * hosted video + cover, or null (caller falls back to a silent reel).
 */
/**
 * Turn English caption lines into casual spoken Hinglish, returning BOTH:
 *   - `deva`: Devanagari, for the TTS voiceover (best pronunciation)
 *   - `roman`: romanised Latin, for the on-screen captions (easier to read)
 * Same order/count as input, or null on failure.
 */
async function hindiForReel(lines: string[]): Promise<{ deva: string[]; roman: string[] } | null> {
  try {
    const out = await geminiJson<{ deva: string[]; roman: string[] }>(
      `Rewrite each line as the everyday, casual spoken Hindi that ordinary Indians actually use in daily conversation ` +
        `(Hinglish) — friendly and natural, NOT formal, literary or "shuddh"/Sanskritised Hindi. Freely mix in the common ` +
        `English words Indians normally say (party, election, government, team, plan, market, video, etc.).\n` +
        `For EACH line give two forms of the SAME sentence:\n` +
        `- "deva": in Devanagari script (English loanwords transliterated, e.g. इलेक्शन, गवर्नमेंट, टीम; numbers in Devanagari numerals).\n` +
        `- "roman": the SAME sentence in Roman/Latin letters as Indians casually type it (Hindi words spelled phonetically like "jeet gayi", "abhi", English words in normal English spelling like "election", "government"). ASCII only.\n` +
        `Keep each concise and faithful, SAME number of lines, SAME order. No quotes, no extra commentary.\n` +
        `LINES (JSON array): ${JSON.stringify(lines)}\n` +
        `Return ONLY JSON: {"deva":[ ... ${lines.length} ... ],"roman":[ ... ${lines.length} ... ]}`,
      0.5
    );
    const deva = out?.deva;
    const roman = out?.roman;
    const ok = (a?: string[]) => Array.isArray(a) && a.length === lines.length && a.every((s) => typeof s === "string" && s.trim());
    if (ok(deva) && ok(roman)) {
      return { deva: deva!.map((s) => s.trim()), roman: roman!.map((s) => s.trim()) };
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function reelFromBeats(
  beats: { caption: string; img: { url: string; publicId: string } }[],
  kicker: string,
  accent: string,
  voiceSeed: number,
  lang: "en" | "hi" = "en"
): Promise<{ videoUrl: string; coverUrl: string } | null> {
  if (beats.length < 2) return null;

  // For Hindi reels: narrate from the Devanagari text (best pronunciation) but
  // show ROMANISED captions on screen (easier to read). Kicker stays English.
  // If translation fails we quietly stay in English rather than drop the reel.
  let captions = beats.map((b) => b.caption); // on-screen text (roman for hi)
  let narrationText = captions.join(" ");
  let narrationLang: "en" | "hi" = "en";
  if (lang === "hi") {
    const t = await hindiForReel(captions);
    if (t) {
      captions = t.roman;
      narrationText = t.deva.join(" ");
      narrationLang = "hi";
    }
  }

  const voice = await synthesizeNarration(narrationText, { voiceSeed, lang: narrationLang });
  if (!voice) return null;
  const baseId = await ensureCaptionBase();
  // Background moves (Ken-Burns); the caption is a static bottom strip on top.
  const scenes = beats.map((b, i) => ({
    bgUrl: sceneBgUrl(b.img.publicId),
    captionUrl: captionStripUrl(baseId, { caption: captions[i], kicker, accent }),
  }));
  const rendered = await renderNarratedReel({ scenes, audioUrl: voice.url, weights: captions.map((c) => c.length) });
  if (!rendered) return null;
  const hosted = await uploadReelFile(rendered.path);
  await rendered.cleanup();
  if (!hosted) return null;
  await primeReel(hosted);
  // Cover thumbnail is a static frame, so baking the caption on it is fine.
  return { videoUrl: hosted, coverUrl: sceneStillUrl(beats[0].img.publicId, { caption: beats[0].caption, kicker, accent }) };
}

async function buildArchiveReel(accent: string, style: StylePack, ctaSeed: number, date: Date, lang: "en" | "hi" = "en"): Promise<{ draft: PostDraft; label: string }> {
  const story = await getArchiveStory(date);
  if (!story) return { draft: { slideUrls: [], caption: "", usedSlugs: [], errors: ["no archive story"] }, label: "From the Archives" };

  // Cinematic, period-accurate look for history (NOT the rotating neon style),
  // with a consistent description of the main figure so they're recognisable.
  const HISTORY_STYLE =
    "Cinematic, photorealistic, period-accurate archival documentary photography; dramatic natural lighting, filmic warm tones, shallow depth of field.";
  const who = story.protagonist ? ` The main figure is ${story.protagonist}; keep their appearance consistent and recognisable.` : "";
  // History must be period- and place-accurate: an Indian-history scene should
  // show Indians, but a world-history scene (or one with British-era figures)
  // must NOT be forced Indian. The named protagonist + scene descriptions carry
  // the accuracy, so we only nudge toward Indian people for the India rotations.
  const peopleDirective = story.flavor === "world" ? NEUTRAL_PEOPLE_DIRECTIVE : INDIAN_PEOPLE_DIRECTIVE;

  // One DISTINCT image per story beat. Generated sequentially — firing all of
  // them at once trips the image model's rate limit and they all fail.
  const beats: { caption: string; img: { url: string; publicId: string } }[] = [];
  for (const s of story.scenes) {
    const img = await generateAndHostImage(`${s.imagePrompt}.${who} ${HISTORY_STYLE} ${peopleDirective} No text, no logos, no watermark.`, "4:5");
    if (img?.publicId) beats.push({ caption: s.text, img });
  }
  if (!beats.length) return { draft: { slideUrls: [], caption: "", usedSlugs: [], errors: ["archive image failed"] }, label: story.kicker };
  const coverImg = beats[0].img;

  // Publish the longer read on the website and link to it in the caption.
  const slug = await publishArchiveArticle(story, coverImg.url);
  const link = slug && APP_URL ? `${APP_URL}/articles/${slug}` : undefined;
  const cap = captionBody(story.caption, ctaSeed, link);
  const firstComment = await craftHashtags(story.title, [...story.hashtags.map((h) => h.replace(/^#/, "")), "reels", "reelsindia", "history"]);

  // Storytelling reel: young-Indian-woman voiceover + one image per beat with
  // its own caption, assembled by ffmpeg. Falls back to a silent single-image
  // reel if the voiceover or ffmpeg assembly is unavailable.
  const assembled = await reelFromBeats(beats, story.kicker, accent, Math.floor(date.getTime() / 86_400_000), lang);
  if (assembled) {
    return {
      draft: { slideUrls: [], videoUrl: assembled.videoUrl, coverUrl: assembled.coverUrl, caption: cap, firstComment, usedSlugs: [], errors: [] },
      label: story.kicker,
    };
  }

  // Fallback: silent single-image reel.
  const video = await buildReelVideo(coverImg.publicId, { kicker: story.kicker, hook: story.hook, sub: story.sub, accent });
  if (!video) return { draft: { slideUrls: [], caption: "", usedSlugs: [], errors: ["archive reel build failed"] }, label: story.kicker };
  await primeReel(video);
  return {
    draft: {
      slideUrls: [],
      videoUrl: video,
      coverUrl: overlayUrl(coverImg.publicId, { kicker: story.kicker, hook: story.hook, sub: story.sub, accent }),
      caption: cap,
      firstComment,
      usedSlugs: [],
      errors: [],
    },
    label: story.kicker,
  };
}

// ── Story teaser ─────────────────────────────────────────────────────────────
// Meta's API can't put a link/poll sticker on a Story, but it DOES support a
// tappable MENTION sticker. buildStory makes a full-screen 9:16 teaser with a
// "tap @handle → link in bio" CTA; finalize() then pins the tappable self-mention
// under that CTA so the whole story funnels: tap → our profile → bio link.
async function buildStory(a: Article, accent: string): Promise<PostDraft> {
  const pid = await toPublicId(a.featuredImage);
  if (!pid) return { slideUrls: [], caption: "", usedSlugs: [], errors: ["story image failed"] };
  const slide = storyUrl(pid, { kicker: a.categoryName || "IN THE NEWS", hook: trimWords(a.title, 12), accent });
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
 * action: theme | reel | reelpolitics | reelnews | article | story
 * (defaults chosen by UTC hour). The reel* variants are narrated storytelling
 * reels; spreading them across the day (vs. one batch) reads as more organic
 * and squeezes more reach out of the algorithm.
 */
export async function runSocialSlot(action?: string, date = new Date(), opts: { dryRun?: boolean } = {}): Promise<SocialResult> {
  const style = getStylePack(date);
  const resolved = action || slotForHour(date.getUTCHours());
  const daySeed = Math.floor(date.getTime() / 86400_000);

  if (resolved === "theme") return generateSocialPost(date, { ...opts, alsoStory: true });

  // Indian-politics narrated reel.
  if (resolved === "reelpolitics") {
    const pol = await fetchArticleByCategory(["politics"], new Set());
    if (pol) {
      const draft = await buildNarratedNewsReel(pol, accentFor(style, 2, date), 2, daySeed + 1, reelLang("politics", daySeed));
      return finalize(`Reel · ${pol.categoryName}`, "reel", "news-story", draft, { style: style.name, articleSlug: pol.slug, alsoStory: true }, opts.dryRun);
    }
    console.log("[social-slot] no politics article; falling back to a recent-news reel.");
  }

  // Freshest recent-news narrated reel, led by whatever is trending in India.
  if (resolved === "reelnews" || resolved === "reelpolitics") {
    const pool = (await fetchUnposted(8, 4)).filter((a) => a.categorySlug !== "history");
    const pick = (await biasByTrends(pool, (a) => `${a.title} ${a.excerpt ?? ""}`))[0];
    if (pick) {
      const draft = await buildNarratedNewsReel(pick, accentFor(style, 3, date), 3, daySeed + 2, reelLang("news", daySeed));
      return finalize(`Reel · ${pick.categoryName}`, "reel", "news-story", draft, { style: style.name, articleSlug: pick.slug, alsoStory: true }, opts.dryRun);
    }
  }

  // Reels lead with an evergreen "story from the past" (best for reach/saves).
  // If that can't be produced, fall through to a news-derived reel.
  if (resolved === "reel") {
    const archive = await buildArchiveReel(accentFor(style, 1, date), style, 1, date, reelLang("history", daySeed));
    if (archive.draft.videoUrl) {
      return finalize(archive.label, "reel", "archive", archive.draft, { style: style.name, alsoStory: true }, opts.dryRun);
    }
    console.log(`[social-slot] archive reel unavailable, falling back to news reel. reasons: ${archive.draft.errors.join("; ") || "none"}`);
  }

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

/**
 * Post THREE narrated storytelling Reels in one run:
 *   1) a "from the archives" history reel,
 *   2) an Indian-politics reel from a recent story,
 *   3) another recent news reel.
 * All three use the young-Indian-woman voiceover + one captioned image per beat.
 */
export async function runReelBatch(date = new Date(), opts: { dryRun?: boolean } = {}): Promise<DailySocialResult> {
  const started = Date.now();
  const style = getStylePack(date);
  const daySeed = Math.floor(date.getTime() / 86400_000);
  const used = new Set<string>();
  const posts: SocialResult[] = [];

  // 1) History reel.
  const archive = await buildArchiveReel(accentFor(style, 1, date), style, 1, date, reelLang("history", daySeed));
  posts.push(await finalize(archive.label, "reel", "archive", archive.draft, { style: style.name, alsoStory: true }, opts.dryRun));

  // 2) Indian-politics reel.
  const pol = await fetchArticleByCategory(["politics"], used);
  if (pol) {
    used.add(pol.slug);
    const draft = await buildNarratedNewsReel(pol, accentFor(style, 2, date), 2, daySeed + 1, reelLang("politics", daySeed));
    posts.push(await finalize(`Reel · ${pol.categoryName}`, "reel", "news-story", draft, { style: style.name, articleSlug: pol.slug, alsoStory: true }, opts.dryRun));
  } else {
    posts.push({ ok: false, label: "Reel · Politics", kind: "reel", format: "news-story", slides: 0, instagram: { skipped: "no unposted politics article" }, errors: [] });
  }

  // 3) Another recent news reel (freshest remaining, category-diverse).
  //    Skip History — that's the archive reel's job; a history news reel would
  //    just duplicate it. Prefer a category different from the politics reel,
  //    but fall back to any fresh non-history story.
  const pool = (await fetchUnposted(8, 4)).filter((a) => !used.has(a.slug) && a.categorySlug !== "history");
  // Lead with whatever is spiking in India right now (free reach).
  const candidates = await biasByTrends(pool, (a) => `${a.title} ${a.excerpt ?? ""}`);
  const other = candidates.find((a) => a.categorySlug !== "politics") ?? candidates[0];
  if (other) {
    used.add(other.slug);
    const draft = await buildNarratedNewsReel(other, accentFor(style, 3, date), 3, daySeed + 2, reelLang("news", daySeed));
    posts.push(await finalize(`Reel · ${other.categoryName}`, "reel", "news-story", draft, { style: style.name, articleSlug: other.slug }, opts.dryRun));
  } else {
    posts.push({ ok: false, label: "Reel · Recent", kind: "reel", format: "news-story", slides: 0, instagram: { skipped: "no unposted article" }, errors: [] });
  }

  const posted = posts.filter((p) => p.ok).length;
  return { ok: posted > 0, date: date.toISOString().slice(0, 10), stylePack: style.name, posted, requested: 3, posts, tookMs: Date.now() - started };
}

/**
 * Narration language per reel. We narrate everything in warm spoken Hinglish
 * (the most relatable style for our Indian audience) with the voiceover in
 * Devanagari-backed Hindi for good pronunciation and romanised Latin captions
 * on screen for easy reading.
 */
function reelLang(_kind: "history" | "politics" | "news", _daySeed: number): "en" | "hi" {
  // All reels use the warm Hinglish narration (same Sulafat voice) with
  // romanised on-screen captions — the most relatable/engaging style for our
  // Indian audience. (Kept parameterised so we can re-tune per-type later.)
  return "hi";
}

/** Map a UTC hour to a post type across the Indian day (IST = UTC+5:30). */
// Reel-heavy cadence: reels drive the most new-follower reach, so 3 spread
// across the day (history → politics → recent) plus a morning theme and a
// night story.
function slotForHour(utcHour: number): string {
  if (utcHour < 4) return "theme"; // ~08:00 IST morning
  if (utcHour < 7) return "reel"; // ~10:30 IST — history reel
  if (utcHour < 11) return "reelpolitics"; // ~14:00 IST — Indian politics reel
  if (utcHour < 14) return "reelnews"; // ~18:30 IST — trending recent reel
  return "story"; // ~21:00 IST night
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
