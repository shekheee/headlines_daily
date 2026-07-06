// Trend-jacking: pull what's spiking in India right now (Google Trends daily RSS,
// no API key) so the reel/topic picker can lead with stories tied to what people
// are already searching for — the cheapest reach there is. Best-effort: returns
// [] if the feed is unavailable, so callers must degrade gracefully.

let cache: { at: number; terms: string[] } | null = null;
const TTL = 30 * 60_000; // 30 min

/** Hot search terms in India, most-trending first (lowercased). */
export async function getTrendingTerms(limit = 12): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.terms.slice(0, limit);
  try {
    const res = await fetch("https://trends.google.com/trending/rss?geo=IN", {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    if (!res.ok) return cache?.terms.slice(0, limit) ?? [];
    const xml = await res.text();
    const titles = Array.from(xml.matchAll(/<title>([\s\S]*?)<\/title>/g))
      .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim())
      .filter(Boolean);
    // First <title> is the channel name ("Daily Search Trends"); drop it.
    const terms = titles.slice(1).map((t) => t.toLowerCase());
    cache = { at: Date.now(), terms };
    return terms.slice(0, limit);
  } catch {
    return cache?.terms.slice(0, limit) ?? [];
  }
}

/**
 * Reorder items so those matching a trending term come first (stable otherwise).
 * `text` extracts the searchable string (title/excerpt) from each item.
 */
export async function biasByTrends<T>(items: T[], text: (item: T) => string): Promise<T[]> {
  const terms = await getTrendingTerms();
  if (!terms.length || items.length < 2) return items;
  const score = (item: T): number => {
    const hay = text(item).toLowerCase();
    for (let i = 0; i < terms.length; i++) {
      const words = terms[i].split(/\s+/).filter((w) => w.length > 3);
      if (words.length && words.some((w) => hay.includes(w))) return terms.length - i; // higher = hotter
    }
    return 0;
  };
  return items
    .map((item, i) => ({ item, i, s: score(item) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);
}
