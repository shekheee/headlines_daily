// Evergreen "stories from the past" — the Instagram growth pillar. These are
// AI-written but constrained hard to well-documented, verifiable history so the
// brand stays credible. Rotates across: On This Day (date-anchored, safest),
// India's political history, and world history through an India lens.
import { geminiJson } from "@/lib/gemini";

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
  // The model occasionally returns nothing / malformed JSON on a given call.
  // Retry a few times so a transient miss doesn't drop the history reel entirely.
  for (let attempt = 0; attempt < 3; attempt++) {
    const story = await getArchiveStoryOnce(date);
    if (story) return story;
  }
  return null;
}

async function getArchiveStoryOnce(date = new Date()): Promise<ArchiveStory | null> {
  const flavor = pickFlavor(date);
  const { kickerBase, dstr, instruction, dateRule, tags } = briefFor(flavor, date);

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
    `You are a meticulous history editor for an Indian audience. ${instruction}\n\n` +
      `STRICT RULES — this is a credibility brand:\n` +
      `- Use ONLY well-documented, verifiable facts. NEVER invent events, dates, names, numbers, or quotes.\n` +
      `- If you are unsure about ANY detail, pick a more famous, clearly-documented event instead.\n` +
      `- Neutral, non-partisan, respectful tone. No opinions, no speculation, no sensational claims you can't back up.\n` +
      `- ${dateRule}\n` +
      `- The "body" is a longer read for a news website: 5-7 short paragraphs (~550-750 words) of clean HTML using only <p> tags (an optional <h2> subhead is fine). Cover the background, what happened, the key figures, and why it still matters today. Do NOT pad with invented specifics.\n` +
      `- TELL IT AS A STORY, not a list of facts. Build a clear narrative arc: set the scene, introduce the MAIN PERSON by name, raise the stakes/tension, hit the turning point, then land a satisfying resolution and why it still matters. It must feel COMPLETE — never cut off mid-thought.\n` +
      `- "protagonist": the central historical figure of the story, described period-accurately for an artist (full name, era, clothing, distinctive features) — e.g. "Subhas Chandra Bose, 1940s, round spectacles, military cap and uniform". Use "" only if the event genuinely has no single human protagonist.\n` +
      `- The "scenes" are 5-6 beats of that story. Each beat has: "text" = ONE vivid spoken sentence (max ~15 words, warm spoken-storyteller English, no hashtags/labels/emojis); and "image" = a short description of a DISTINCT, photorealistic, PERIOD-ACCURATE scene for THAT beat. This is documented history — where the protagonist is involved, DEPICT them (name them in the image description and keep their appearance consistent across scenes); audiences expect to SEE the main character. No text, no logos, no watermarks. (Do NOT depict present-day living politicians.)\n` +
      `- Vivid and cinematic, but accuracy comes first.\n\n` +
      `Return ONLY JSON: {"title": headline for the article (max 90 chars), "year": "YYYY", "hook": scroll-stopping reel cover line max 8 words, "sub": max 10 words, "caption": 2-4 sentence Instagram caption, "body": "<p>...</p>", "metaDescription": max 155 chars, "protagonist": "period-accurate description of the main figure or \\"\\"", "scenes": [{"text": "spoken sentence", "image": "distinct period-accurate scene, depicting the protagonist where relevant"}], "imagePrompt": "a photorealistic editorial scene illustrating the event, no text, no logos, no watermark", "confidence": "high" | "medium" | "low"}`,
    0.6
  );

  if (!data || !data.hook || !data.caption || !data.imagePrompt || !data.body || !data.title) return null;
  if ((data.confidence || "").toLowerCase() === "low") return null;

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
  };
}

/** Rough sentence splitter for narration fallback. */
function splitSentences(text: string): string[] {
  return (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
