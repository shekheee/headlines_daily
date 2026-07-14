// Evergreen "stories from the past" — the Instagram growth pillar. These are
// AI-written but constrained hard to well-documented, verifiable history so the
// brand stays credible. Rotates across: On This Day (date-anchored, safest),
// India's political history, and world history through an India lens.
import { geminiJson } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export type ArchiveFlavor = "onthisday" | "political" | "world";

export interface ArchiveStory {
  kicker: string; // overlay kicker, e.g. "ON THIS DAY, 5 JULY 1980"
  hook: string;
  sub: string;
  caption: string;
  imagePrompt: string;
  hashtags: string[];
  // For the companion website article (the longer read).
  title: string;
  body: string; // HTML (<p>/<h2>)
  metaDescription: string;
  // For the narrated storytelling reel: ordered beats. Each beat's text is a
  // spoken line (also the on-screen caption for that scene); its imagePrompt is
  // a DISTINCT visual for that beat. narration = scenes.map(s => s.text).
  narration: string[];
  scenes: { text: string; imagePrompt: string }[];
  // Period-accurate visual description of the main historical figure(s), so
  // every scene can depict them consistently (empty if the event has no clear
  // human protagonist).
  protagonist: string;
  // Which rotation produced this story. "world" stories can feature non-Indian
  // figures/places, so callers should NOT force Indian imagery on them.
  flavor: ArchiveFlavor;
}

const FLAVORS: ArchiveFlavor[] = ["onthisday", "political", "world"];

/** Deterministic rotation by day-of-year so consecutive days differ. */
export function pickFlavor(date = new Date()): ArchiveFlavor {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start) / 86_400_000);
  return FLAVORS[doy % FLAVORS.length];
}

function briefFor(flavor: ArchiveFlavor, date: Date): { kickerBase: string; dstr: string; instruction: string; dateRule: string; tags: string[] } {
  const dstr = date.toLocaleDateString("en-IN", { day: "numeric", month: "long" }); // e.g. "5 July"
  switch (flavor) {
    case "onthisday":
      return {
        kickerBase: "ON THIS DAY",
        dstr,
        instruction: `Pick ONE genuinely notable, well-documented event from Indian history that happened on ${dstr} (in any year). The event MUST have occurred on ${dstr} — if you are unsure of the exact date, choose a different, clearly-dated event. It must be widely reported and easy to verify.`,
        // Anchor the story to the exact date so viewers can correlate it.
        dateRule: `Begin the caption with the exact date, e.g. "On ${dstr} {year}, ...". The "year" field must be the accurate year of the event.`,
        tags: ["#onthisday", "#indianhistory", "#history", "#didyouknow"],
      };
    case "political":
      return {
        kickerBase: "FROM THE ARCHIVES",
        dstr,
        instruction: `Pick ONE fascinating, well-documented moment from India's political history — a landmark court verdict, a famous scandal, a historic election, or a pivotal national decision. It must be widely reported and verifiable. Keep it strictly non-partisan.`,
        dateRule: `Begin the caption by stating when it happened (month and year, e.g. "In March 1977, ..."). The "year" field must be accurate.`,
        tags: ["#indianpolitics", "#politicalhistory", "#history", "#india"],
      };
    case "world":
      return {
        kickerBase: "WORLD REWIND",
        dstr,
        instruction: `Pick ONE major, well-documented event from world history that had a real connection to, or impact on, India. It must be widely reported and verifiable.`,
        dateRule: `Begin the caption by stating the year it happened (e.g. "In 1971, ..."). The "year" field must be accurate.`,
        tags: ["#worldhistory", "#history", "#india", "#didyouknow"],
      };
  }
}

/**
 * Returns a ready-to-render historical story, or null if the model wasn't
 * confident enough (we'd rather skip than post a shaky "fact").
 */
export async function getArchiveStory(date = new Date()): Promise<ArchiveStory | null> {
  // Every history reel is also published as a `history` article, so that list is
  // our memory of what's already been covered. Without it the model keeps
  // re-picking the same handful of famous events (duplicates every few days).
  const covered = await recentlyCoveredTitles();
  // The model occasionally returns nothing / malformed JSON on a given call.
  // Retry a few times so a transient miss (or a rejected duplicate) doesn't drop
  // the history reel entirely.
  for (let attempt = 0; attempt < 4; attempt++) {
    const story = await getArchiveStoryOnce(date, covered);
    if (story) return story;
  }
  return null;
}

/** Titles of history stories already published (our "already covered" memory). */
async function recentlyCoveredTitles(days = 200, limit = 120): Promise<string[]> {
  try {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since }, category: { slug: "history" } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { title: true },
    });
    return rows.map((r) => r.title).filter(Boolean);
  } catch {
    return [];
  }
}

async function getArchiveStoryOnce(date = new Date(), covered: string[] = []): Promise<ArchiveStory | null> {
  const flavor = pickFlavor(date);
  const { kickerBase, dstr, instruction, dateRule, tags } = briefFor(flavor, date);
  const avoidBlock = covered.length
    ? `\n\nALREADY COVERED — do NOT pick any of these events or a close variation of them; choose a clearly DIFFERENT event/topic:\n${covered
        .slice(0, 80)
        .map((t) => `• ${t}`)
        .join("\n")}\n`
    : "";

  const data = await geminiJson<{
    title: string;
    year: string;
    hook: string;
    sub: string;
    caption: string;
    body: string;
    metaDescription: string;
    scenes: { text: string; image: string }[];
    protagonist: string;
    imagePrompt: string;
    confidence: string;
  }>(
    `You are a meticulous history editor for an Indian audience. ${instruction}${avoidBlock}\n\n` +
      `STRICT RULES — this is a credibility brand:\n` +
      `- Use ONLY well-documented, verifiable facts. NEVER invent events, dates, names, numbers, or quotes.\n` +
      `- If you are unsure about ANY detail, pick a more famous, clearly-documented event instead.\n` +
      `- Neutral, non-partisan, respectful tone. No opinions, no speculation, no sensational claims you can't back up.\n` +
      `- ${dateRule}\n` +
      `- The "body" is a longer read for a news website: 5-7 short paragraphs (~550-750 words) of clean HTML using only <p> tags (an optional <h2> subhead is fine). Cover the background, what happened, the key figures, and why it still matters today. Do NOT pad with invented specifics.\n` +
      `- TELL IT AS A STORY, not a list of facts. This is an Instagram Reel, so a viewer must INSTANTLY know who/what it is about and be pulled to watch to the end.\n` +
      `- GOLDEN RULE: be exactly ONE step ahead of the viewer, never ten — close enough to instantly understand, new enough to matter. Win on clarity, not cleverness. Anchor in what people already recognise, then reveal the fresh angle.\n` +
      `- REELS PSYCHOLOGY for the "scenes": Beat 1 is THE HOOK and owns the first 4 seconds. FIRST anchor in something familiar (a recognisable name, place, era or shared feeling) so it lands instantly; THEN add the ONE surprising fact or real stake, naming the person/event. 4-SECOND CONTRACT: a stranger watching with sound OFF must grasp WHO/WHAT it's about AND why to care from Beat 1 alone. Then: set the scene, raise the tension, hit the turning point, and the FINAL beat lands the clear takeaway — the one thing to remember and why it still matters. Each line should make the viewer want the next one. Every sentence must be plain, concrete and understandable with sound OFF.\n` +
      `- "protagonist": the central historical figure of the story, described period-accurately for an artist (full name, era, clothing, distinctive features) — e.g. "Subhas Chandra Bose, 1940s, round spectacles, military cap and uniform". Use "" only if the event genuinely has no single human protagonist.\n` +
      `- The "scenes" are 5-6 beats of that story. Each beat has: "text" = ONE vivid, CLEAR spoken sentence (max ~14 words, warm spoken-storyteller English, concrete, no jargon/hashtags/labels/emojis); and "image" = a short description of a DISTINCT, photorealistic, PERIOD-ACCURATE scene for THAT beat. This is documented history — where the protagonist is involved, DEPICT them (name them in the image description and keep their appearance consistent across scenes); audiences expect to SEE the main character. No text, no logos, no watermarks. (Do NOT depict present-day living politicians.)\n` +
      `- Vivid and cinematic, but accuracy and CLARITY come first.\n\n` +
      `Return ONLY JSON: {"title": headline for the article (max 90 chars), "year": "YYYY", "hook": scroll-stopping reel cover line max 8 words, "sub": max 10 words, "caption": 2-4 sentence Instagram caption, "body": "<p>...</p>", "metaDescription": max 155 chars, "protagonist": "period-accurate description of the main figure or \\"\\"", "scenes": [{"text": "spoken sentence", "image": "distinct period-accurate scene, depicting the protagonist where relevant"}], "imagePrompt": "a photorealistic editorial scene illustrating the event, no text, no logos, no watermark", "confidence": "high" | "medium" | "low"}`,
    0.6
  );

  if (!data || !data.hook || !data.caption || !data.imagePrompt || !data.body || !data.title) return null;
  if ((data.confidence || "").toLowerCase() === "low") return null;
  // Backstop against the model ignoring the "already covered" list — reject a
  // near-duplicate so the retry loop asks for a fresh event instead.
  if (isDuplicateTitle(data.title, covered)) return null;

  // Scene beats (fallback: split the caption into sentences, reusing the main image).
  const rawScenes =
    Array.isArray(data.scenes) && data.scenes.length
      ? data.scenes
      : splitSentences(data.caption).map((t) => ({ text: t, image: data.imagePrompt }));
  const scenes = rawScenes
    .map((s) => ({ text: (s.text || "").trim(), imagePrompt: (s.image || data.imagePrompt || "").trim() }))
    .filter((s) => s.text && s.imagePrompt)
    .slice(0, 6);
  if (!scenes.length) return null;
  const narration = scenes.map((s) => s.text);

  const year = (data.year || "").trim();
  // Put the FULL date on the overlay: today's day+month for "On This Day", plus
  // the event's year, so the correlation ("today, but in <year>") is explicit.
  const kicker =
    flavor === "onthisday"
      ? `${kickerBase}, ${dstr.toUpperCase()}${year ? ` ${year}` : ""}` // e.g. "ON THIS DAY, 5 JULY 1980"
      : kickerBase;
  const baseSub = (data.sub || data.title || "").trim();
  const sub = flavor === "onthisday" ? baseSub.slice(0, 80) : (year ? `${year}: ${baseSub}` : baseSub).slice(0, 80);
  return {
    kicker,
    hook: data.hook,
    sub,
    caption: data.caption,
    imagePrompt: data.imagePrompt,
    hashtags: tags,
    title: data.title,
    body: data.body,
    metaDescription: data.metaDescription || data.caption,
    narration,
    scenes,
    protagonist: (data.protagonist || "").trim(),
    flavor,
  };
}

// Generic words that don't identify a specific event — ignored when comparing
// two titles so we match on the distinctive nouns/names/years.
const TITLE_STOPWORDS = new Set([
  "the", "of", "in", "on", "a", "an", "and", "to", "for", "how", "why", "when", "that", "this", "with", "from",
  "was", "were", "is", "are", "at", "by", "its", "his", "her", "their", "as", "into", "over",
  "india", "indian", "indians", "history", "historical", "story", "stories", "day", "year", "years",
  "first", "most", "new", "great", "day's", "todays",
]);

function keyTokens(title: string): { words: Set<string>; years: Set<string> } {
  const words = new Set<string>();
  const years = new Set<string>();
  for (const raw of (title || "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw) continue;
    if (/^\d{4}$/.test(raw)) years.add(raw);
    else if (raw.length >= 3 && !TITLE_STOPWORDS.has(raw)) words.add(raw);
  }
  return { words, years };
}

/** True when `candidate` describes essentially the same event as one already covered. */
function isDuplicateTitle(candidate: string, covered: string[]): boolean {
  const c = keyTokens(candidate);
  if (!c.words.size) return false;
  for (const prev of covered) {
    const p = keyTokens(prev);
    if (!p.words.size) continue;
    const shared = [...c.words].filter((w) => p.words.has(w)).length;
    const jaccard = shared / (c.words.size + p.words.size - shared);
    const sameYear = [...c.years].some((y) => p.years.has(y));
    if (jaccard >= 0.6) return true; // titles overlap heavily
    if (sameYear && shared >= 2) return true; // same year + same key subjects
  }
  return false;
}

/** Rough sentence splitter for narration fallback. */
function splitSentences(text: string): string[] {
  return (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
