import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/public/ArticleCard";
import { NewsTicker } from "@/components/public/NewsTicker";
import { AdSlot } from "@/components/public/AdSlot";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate",
  description: "Your trusted source for headlines, breaking stories, and in-depth analysis.",
};

// 5-min ISR: articles are generated ~once/day, so this is plenty fresh while
// keeping background regenerations (and Neon compute wake-ups) to a minimum.
export const revalidate = 300;

// History is evergreen and lives in its own section — it shouldn't lead the
// homepage as breaking/top news.
const NEWS_ONLY = { NOT: { category: { slug: "history" } } } as const;

async function getHomeData() {
  const [featuredArticles, categories, latestArticles, trendingArticles] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...NEWS_ONLY },
      orderBy: [{ publishedAt: "desc" }],
      take: 10,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, publishedAt: true, readingTime: true, isFeatured: true,
        author: { select: { name: true } },
        category: { select: { name: true, slug: true, color: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 7,
      select: {
        id: true, name: true, slug: true, color: true,
        articles: {
          where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
          orderBy: { publishedAt: "desc" },
          take: 4,
          select: {
            id: true, title: true, slug: true, excerpt: true,
            featuredImage: true, publishedAt: true, readingTime: true, isFeatured: true,
            author: { select: { name: true } },
            category: { select: { name: true, slug: true, color: true } },
          },
        },
      },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...NEWS_ONLY },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, publishedAt: true, readingTime: true, isFeatured: true,
        author: { select: { name: true } },
        category: { select: { name: true, slug: true, color: true } },
      },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...NEWS_ONLY },
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: 6,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, publishedAt: true, readingTime: true, isFeatured: true,
        author: { select: { name: true } },
        category: { select: { name: true, slug: true, color: true } },
      },
    }),
  ]);

  return { featuredArticles, categories, latestArticles, trendingArticles };
}

export default async function HomePage() {
  const { featuredArticles, categories, latestArticles, trendingArticles } = await getHomeData();
  const lead = featuredArticles[0];
  const heroSidebar = featuredArticles.slice(1, 6);
  const tickerItems = featuredArticles.slice(0, 8).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category ? { name: a.category.name, color: a.category.color } : null,
  }));

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="container px-4 py-5 max-w-7xl mx-auto">

        {/* ── Moving-news ticker ──────────── */}
        <NewsTicker items={tickerItems} />

        {/* ── Top banner ad ───────────────── */}
        <AdSlot position="HEADER" className="mb-5" />

        {/* ── HERO GRID ───────────────────── */}
        {/* Static lead feature on the left, stacked headlines on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Lead story */}
          <div className="lg:col-span-2">
            {lead ? (
              <ArticleCard article={lead} variant="hero" />
            ) : (
              <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                No featured article
              </div>
            )}
          </div>

          {/* Right: stacked headline list */}
          <div className="lg:border-l lg:border-gray-200 lg:pl-6">
            {heroSidebar.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </div>

        {/* ── CATEGORY SECTIONS ───────────── */}
        {categories
          .filter((cat) => cat.articles.length > 0)
          .map((cat, idx) => {
            const [lead, ...rest] = cat.articles;
            return (
              <section key={cat.id} className="mb-8">
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-900">
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-[0.15em] px-2 py-0.5 text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex-1" />
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:text-red-600 transition-colors"
                  >
                    See All →
                  </Link>
                </div>

                {/* Layout: lead feature (left) + stacked headlines (right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lead && (
                    <div>
                      <ArticleCard article={lead} variant="default" />
                    </div>
                  )}
                  {rest.length > 0 && (
                    <div className="md:border-l md:border-gray-200 md:pl-6">
                      {rest.map((a) => (
                        <ArticleCard key={a.id} article={a} variant="compact" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline ad every 3rd section */}
                {idx === 2 && <AdSlot position="ARTICLE_INLINE" className="mt-6" />}
              </section>
            );
          })}

        {/* ── LATEST + SIDEBAR ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
          {/* Latest news list */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-900">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] px-2 py-0.5 text-white bg-gray-900">
                Latest
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {latestArticles.map((a) => (
                <ArticleCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          </div>

          {/* Sidebar: Trending / Most Read + any ads */}
          <aside className="space-y-6">
            {trendingArticles.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-red-600">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] px-2 py-0.5 text-white bg-red-600">
                    Trending
                  </span>
                </div>
                <ol className="space-y-4">
                  {trendingArticles.map((a, i) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="text-2xl font-bold leading-none text-gray-300 w-7 shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="text-sm font-semibold leading-snug text-gray-900 hover:text-red-600 transition-colors"
                        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <AdSlot position="SIDEBAR_TOP" />
            <AdSlot position="SIDEBAR_BOTTOM" />
          </aside>
        </div>

        {/* Footer ad */}
        <AdSlot position="FOOTER" className="mt-10" />
      </div>
    </div>
  );
}

