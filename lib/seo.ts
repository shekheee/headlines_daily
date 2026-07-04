// Central SEO helpers: canonical URLs + JSON-LD builders for Organization,
// WebSite (with sitelinks search box), NewsArticle and Breadcrumbs.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Headlines Daily";
// Optional publisher logo (recommended by Google News). Set NEXT_PUBLIC_LOGO_URL
// to a >=112px, <=60px-tall PNG for full eligibility.
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "";

export function abs(path: string): string {
  if (!path) return APP_URL;
  if (/^https?:\/\//.test(path)) return path;
  return `${APP_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function stripHtml(html: string, max = 300): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function publisher(): Record<string, unknown> {
  const pub: Record<string, unknown> = { "@type": "Organization", name: APP_NAME, url: APP_URL || undefined };
  if (LOGO_URL) pub.logo = { "@type": "ImageObject", url: abs(LOGO_URL) };
  return pub;
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: APP_NAME,
    url: APP_URL || undefined,
    ...(LOGO_URL ? { logo: { "@type": "ImageObject", url: abs(LOGO_URL) } } : {}),
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL || undefined,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ArticleSchemaInput {
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  authorName?: string | null;
  section?: string | null;
  keywords?: string[];
}

export function newsArticleSchema(a: ArticleSchemaInput): Record<string, unknown> {
  const url = `${APP_URL}/articles/${a.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title.slice(0, 110),
    description: a.description || undefined,
    image: a.image ? [abs(a.image)] : undefined,
    datePublished: a.publishedAt?.toISOString(),
    dateModified: (a.updatedAt || a.publishedAt)?.toISOString(),
    author: [{ "@type": "Person", name: a.authorName || APP_NAME }],
    publisher: publisher(),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: a.section || undefined,
    keywords: a.keywords && a.keywords.length ? a.keywords.join(", ") : undefined,
    url,
    isAccessibleForFree: true,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}
