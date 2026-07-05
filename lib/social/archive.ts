// Evergreen "stories from the past" — the Instagram growth pillar. These are
// AI-written but constrained hard to well-documented, verifiable history so the
// brand stays credible. Rotates across: On This Day (date-anchored, safest),
// India's political history, and world history through an India lens.
import { geminiJson } from "@/lib/gemini";

export type ArchiveFlavor = "onthisday" | "political" | "world";

export interface ArchiveStory {
  kicker: string; // overlay kicker, e.g. "ON THIS DAY"
  hook: string;
  sub: string;
  caption: string;
  imagePrompt: string;
  hashtags: string[];
}

const FLAVORS: ArchiveFlavor[] = ["onthisday", "political", "world"];

/** Deterministic rotation by day-of-year so consecutive days differ. */
export function pickFlavor(date = new Date()): ArchiveFlavor {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start) / 86_400_000);
  return FLAVORS[doy % FLAVORS.length];
}

function briefFor(flavor: ArchiveFlavor, date: Date): { kicker: string; instruction: string; tags: string[] } {
  const dstr = date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  switch (flavor) {
    case "onthisday":
      return {
        kicker: "ON THIS DAY",
        instruction: `Pick ONE genuinely notable, well-documented event from Indian history that happened on ${dstr} (in any year). It must be widely reported and easy to verify.`,
        tags: ["#onthisday", "#indianhistory", "#history", "#didyouknow"],
      };
    case "political":
      return {
        kicker: "FROM THE ARCHIVES",
        instruction: `Pick ONE fascinating, well-documented moment from India's political history — a landmark court verdict, a famous scandal, a historic election, or a pivotal national decision. It must be widely reported and verifiable. Keep it strictly non-partisan.`,
        tags: ["#indianpolitics", "#politicalhistory", "#history", "#india"],
      };
    case "world":
      return {
        kicker: "WORLD REWIND",
        instruction: `Pick ONE major, well-documented event from world history that had a real connection to, or impact on, India. It must be widely reported and verifiable.`,
        tags: ["#worldhistory", "#history", "#india", "#didyouknow"],
      };
  }
}

/**
 * Returns a ready-to-render historical story, or null if the model wasn't
 * confident enough (we'd rather skip than post a shaky "fact").
 */
export async function getArchiveStory(date = new Date()): Promise<ArchiveStory | null> {
  const flavor = pickFlavor(date);
  const { kicker, instruction, tags } = briefFor(flavor, date);

  const data = await geminiJson<{
    title: string;
    year: string;
    hook: string;
    sub: string;
    caption: string;
    imagePrompt: string;
    confidence: string;
  }>(
    `You are a meticulous history editor for an Indian audience. ${instruction}\n\n` +
      `STRICT RULES — this is a credibility brand:\n` +
      `- Use ONLY well-documented, verifiable facts. NEVER invent events, dates, names, numbers, or quotes.\n` +
      `- If you are unsure about ANY detail, pick a more famous, clearly-documented event instead.\n` +
      `- Neutral, non-partisan, respectful tone. No opinions, no speculation, no sensational claims you can't back up.\n` +
      `- Vivid and engaging for Instagram, but accuracy comes first.\n\n` +
      `Return ONLY JSON: {"title": short title, "year": "YYYY", "hook": scroll-stopping cover line max 8 words, "sub": max 10 words, "caption": 2-4 sentence story, "imagePrompt": "a photorealistic editorial scene illustrating the event, no text, no logos, no watermark", "confidence": "high" | "medium" | "low"}`,
    0.6
  );

  if (!data || !data.hook || !data.caption || !data.imagePrompt) return null;
  if ((data.confidence || "").toLowerCase() === "low") return null;

  const yr = data.year ? ` · ${data.year}` : "";
  return {
    kicker,
    hook: data.hook,
    sub: data.sub || (data.title ? `${data.title}${yr}` : ""),
    caption: data.caption,
    imagePrompt: data.imagePrompt,
    hashtags: tags,
  };
}
