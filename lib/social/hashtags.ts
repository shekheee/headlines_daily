// AI hashtag engine. For a small account, discovery comes from RANKABLE hashtags:
// a tier of low-competition niche tags (where a small post can actually surface),
// a few mid-size tags, and one or two broad ones. Gemini picks tags specific to
// each post's topic so we're not spamming the same generic set every time
// (repeating identical hashtag blocks is a shadowban risk).
import { geminiJson } from "@/lib/gemini";

// A tiny always-on brand core so the page is still findable under its niche.
const CORE = ["news", "indianews", "india"];

function sanitize(tag: string): string {
  const t = tag.replace(/^#/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return t ? `#${t}` : "";
}

/**
 * Build a discovery-optimised hashtag string for one post. `extra` are caller
 * hints (e.g. category, "reels"). Falls back to core + hints if the model fails.
 */
export async function craftHashtags(topic: string, extra: string[] = []): Promise<string> {
  let picked: string[] = [];
  try {
    const out = await geminiJson<{ niche: string[]; medium: string[]; broad: string[] }>(
      `You are an Instagram growth strategist for an Indian news & history page. ` +
        `Pick hashtags that maximise DISCOVERY for a SMALL account (few followers).\n` +
        `POST TOPIC: ${topic}\n\n` +
        `RULES:\n` +
        `- Real, commonly-used hashtags only. No banned, spammy, or engagement-bait tags (no #followforfollow, #like4like, #f4f).\n` +
        `- All lowercase, no spaces, no punctuation, India-relevant, specific to THIS topic.\n` +
        `- "niche": 7 LOW-competition, highly specific tags where a small post can actually rank.\n` +
        `- "medium": 4 mid-size tags for the sub-topic.\n` +
        `- "broad": 2 large reach tags.\n` +
        `Return ONLY JSON: {"niche":[...],"medium":[...],"broad":[...]}`,
      0.7
    );
    picked = [...(out?.niche || []), ...(out?.medium || []), ...(out?.broad || [])];
  } catch {
    /* fall back below */
  }
  const all = [...CORE, ...extra, ...picked].map(sanitize).filter(Boolean);
  const deduped = Array.from(new Set(all)).filter((t) => t.length > 3 && t.length <= 31);
  // 12-15 tiered tags is the sweet spot for a small account's discovery.
  return deduped.slice(0, 15).join(" ");
}
