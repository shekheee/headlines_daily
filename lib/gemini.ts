// Minimal Gemini REST client (no SDK dependency) for rewriting news items
// into original, ATS-clean article copy.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface RewrittenArticle {
  title: string;
  excerpt: string;
  content: string; // simple HTML for the TipTap-rendered body
  metaDescription: string;
  tags: string[];
}

const SYSTEM = `You are a senior news editor at a leading INDIAN news publication writing for
an Indian audience. You are given a headline and short summary from a public news feed.
Rewrite it into an ORIGINAL, concise news article in your own words — do NOT copy the
source phrasing.

Rules:
- Write for Indian readers: where relevant, foreground the India angle and Indian impact,
  use Indian English spelling and Indian context (₹/rupees for money where applicable,
  IST for times, Indian place names). For world stories, briefly note why it matters to India.
- Neutral, factual, journalistic tone. No opinion, no fabrication of specifics
  (names, numbers, quotes) that aren't implied by the source. If unsure, stay general.
- 4-6 short paragraphs (~220-380 words total).
- Write it as a complete, standalone news report. Do NOT add editor's notes, sourcing
  disclaimers, or any mention of AI, automation, or where the story came from.
- Return ONLY JSON with keys: title, excerpt (<=160 chars), content (HTML using only
  <p>, <h2>, <strong>, <em>, <ul>, <li> tags), metaDescription (<=155 chars),
  tags (3-6 short lowercase topic tags).`;

/** Generic Gemini JSON call. Returns parsed JSON of type T, or null on failure. */
export async function geminiJson<T = unknown>(prompt: string, temperature = 0.9): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text)
    .join("");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function rewriteArticle(input: {
  sourceTitle: string;
  sourceSummary: string;
  sourceName: string;
  category: string;
}): Promise<RewrittenArticle | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const prompt = `${SYSTEM}

CATEGORY: ${input.category}
SOURCE: ${input.sourceName}
HEADLINE: ${input.sourceTitle}
SUMMARY: ${input.sourceSummary}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
    undefined;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (!parsed.title || !parsed.content) return null;
    return {
      title: String(parsed.title).trim(),
      excerpt: String(parsed.excerpt || "").trim().slice(0, 200),
      content: String(parsed.content).trim(),
      metaDescription: String(parsed.metaDescription || parsed.excerpt || "").trim().slice(0, 160),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: unknown) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6) : [],
    };
  } catch {
    return null;
  }
}
