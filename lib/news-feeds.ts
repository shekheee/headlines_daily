// RSS sources mapped to the site's existing category slugs.
// BBC feeds are reliable, well-formed, and include media thumbnails.
export interface FeedSource {
  categorySlug: string;
  name: string;
  url: string;
}

export const FEED_SOURCES: FeedSource[] = [
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
];
