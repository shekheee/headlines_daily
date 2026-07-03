// RSS sources for an INDIAN-audience news site, mapped to the site's category slugs.
// Mix of leading Indian outlets (Times of India, The Hindu, NDTV, Indian Express)
// for breadth and variety, India-first.
export interface FeedSource {
  categorySlug: string;
  name: string;
  url: string;
}

export const FEED_SOURCES: FeedSource[] = [
  // ── India (national) ──────────────────────────────────────────
  { categorySlug: "india", name: "Times of India – India", url: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms" },
  { categorySlug: "india", name: "The Hindu – National", url: "https://www.thehindu.com/news/national/feeder/default.rss" },
  { categorySlug: "india", name: "NDTV – India", url: "https://feeds.feedburner.com/ndtvnews-india-news" },
  { categorySlug: "india", name: "Indian Express – India", url: "https://indianexpress.com/section/india/feed/" },

  // ── Politics ──────────────────────────────────────────────────
  { categorySlug: "politics", name: "Indian Express – Political Pulse", url: "https://indianexpress.com/section/political-pulse/feed/" },
  { categorySlug: "politics", name: "NDTV – India", url: "https://feeds.feedburner.com/ndtvnews-india-news" },

  // ── World ─────────────────────────────────────────────────────
  { categorySlug: "world", name: "Times of India – World", url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms" },
  { categorySlug: "world", name: "The Hindu – International", url: "https://www.thehindu.com/news/international/feeder/default.rss" },
  { categorySlug: "world", name: "NDTV – World", url: "https://feeds.feedburner.com/ndtvnews-world-news" },

  // ── Business ──────────────────────────────────────────────────
  { categorySlug: "business", name: "Times of India – Business", url: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms" },
  { categorySlug: "business", name: "The Hindu – Business", url: "https://www.thehindu.com/business/feeder/default.rss" },
  { categorySlug: "business", name: "Indian Express – Business", url: "https://indianexpress.com/section/business/feed/" },

  // ── Sports (cricket-heavy for India) ──────────────────────────
  { categorySlug: "sports", name: "Times of India – Sports", url: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms" },
  { categorySlug: "sports", name: "The Hindu – Sport", url: "https://www.thehindu.com/sport/feeder/default.rss" },
  { categorySlug: "sports", name: "NDTV – Sports", url: "https://feeds.feedburner.com/ndtvsports-latest" },

  // ── Technology ────────────────────────────────────────────────
  { categorySlug: "technology", name: "Times of India – Tech", url: "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms" },
  { categorySlug: "technology", name: "The Hindu – Sci-Tech", url: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss" },
  { categorySlug: "technology", name: "NDTV Gadgets 360", url: "https://feeds.feedburner.com/gadgets360-latest" },

  // ── Entertainment (Bollywood) ─────────────────────────────────
  { categorySlug: "entertainment", name: "Times of India – Entertainment", url: "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms" },
  { categorySlug: "entertainment", name: "Indian Express – Entertainment", url: "https://indianexpress.com/section/entertainment/feed/" },

  // ── Science ───────────────────────────────────────────────────
  { categorySlug: "science", name: "The Hindu – Science", url: "https://www.thehindu.com/sci-tech/science/feeder/default.rss" },
  { categorySlug: "science", name: "Times of India – Science", url: "https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms" },
];
