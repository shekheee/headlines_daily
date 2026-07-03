// RSS sources mapped to the site's existing category slugs.
// BBC feeds are reliable, well-formed, and include media thumbnails.
export interface FeedSource {
  categorySlug: string;
  name: string;
  url: string;
}

export const FEED_SOURCES: FeedSource[] = [
  // BBC
  { categorySlug: "world", name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { categorySlug: "uk", name: "BBC UK", url: "https://feeds.bbci.co.uk/news/uk/rss.xml" },
  { categorySlug: "politics", name: "BBC Politics", url: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
  { categorySlug: "business", name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { categorySlug: "technology", name: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { categorySlug: "science", name: "BBC Science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  { categorySlug: "sports", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { categorySlug: "entertainment", name: "BBC Entertainment", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
  { categorySlug: "culture", name: "BBC Culture", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
  { categorySlug: "india", name: "BBC India", url: "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml" },
  // The Guardian (adds variety + reduces idea repetition)
  { categorySlug: "world", name: "Guardian World", url: "https://www.theguardian.com/world/rss" },
  { categorySlug: "uk", name: "Guardian UK", url: "https://www.theguardian.com/uk-news/rss" },
  { categorySlug: "politics", name: "Guardian Politics", url: "https://www.theguardian.com/politics/rss" },
  { categorySlug: "business", name: "Guardian Business", url: "https://www.theguardian.com/uk/business/rss" },
  { categorySlug: "technology", name: "Guardian Tech", url: "https://www.theguardian.com/uk/technology/rss" },
  { categorySlug: "science", name: "Guardian Science", url: "https://www.theguardian.com/science/rss" },
  { categorySlug: "sports", name: "Guardian Sport", url: "https://www.theguardian.com/uk/sport/rss" },
  { categorySlug: "entertainment", name: "Guardian Film", url: "https://www.theguardian.com/film/rss" },
  { categorySlug: "culture", name: "Guardian Culture", url: "https://www.theguardian.com/uk/culture/rss" },
  { categorySlug: "india", name: "Guardian India", url: "https://www.theguardian.com/world/india/rss" },
  // Additional world desks
  { categorySlug: "world", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { categorySlug: "world", name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
];
