import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/public/ArticleCard";
import { AdSlot } from "@/components/public/AdSlot";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Headlines Daily",
  description: "Your trusted source for headlines, breaking stories, and in-depth analysis.",
};

export const revalidate = 60;

async function getHomeData() {
  const [featuredArticles, categories, latestArticles] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 5,
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
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 8,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, publishedAt: true, readingTime: true, isFeatured: true,
        author: { select: { name: true } },
        category: { select: { name: true, slug: true, color: true } },
      },
    }),
  ]);

  return { featuredArticles, categories, latestArticles };
}

export default async function HomePage() {
  const { featuredArticles, categories, latestArticles } = await getHomeData();
  const [hero, ...topGrid] = featuredArticles;

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="container px-4 py-5 max-w-7xl mx-auto">

        {/* ── Top banner ad ───────────────── */}
        <AdSlot position="HEADER" className="mb-5" />

        {/* ── HERO GRID ───────────────────── */}
        {/* Large hero on left, 4 stacked on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5 mb-8 bg-gray-200">
          {/* Big hero */}
          <div className="lg:col-span-2 bg-[#f7f7f5]">
            {hero ? (
              <ArticleCard article={hero} variant="hero" />
            ) : (
              <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                No featured article
              </div>
            )}
          </div>

          {/* Right: 2×2 grid of default cards */}
          <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
            {topGrid.slice(0, 4).map((a) => (
              <div key={a.id} className="bg-[#f7f7f5] p-3">
                <ArticleCard article={a} variant="default" />
              </div>
            ))}
          </div>
        </div>

        {/* ── CATEGORY SECTIONS ───────────── */}
        {categories
          .filter((cat) => cat.articles.length > 0)
          .map((cat, idx) => {
            const [lead, ...rest] = cat.articles;
            return (
              <section key={cat.id} className="mb-10">
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

                {/* Layout: lead (large left) + row of smaller articles */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {/* Lead article — larger */}
                  {lead && (
                    <div className="md:col-span-2">
                      <ArticleCard article={lead} variant="default" />
                    </div>
                  )}
                  {/* Rest — compact-ish */}
                  {rest.map((a) => (
                    <div key={a.id}>
                      <ArticleCard article={a} variant="default" />
                    </div>
                  ))}
                </div>

                {/* Inline ad every 3rd section */}
                {idx === 2 && <AdSlot position="ARTICLE_INLINE" className="mt-6" />}
              </section>
            );
          })}

        {/* ── LATEST + SIDEBAR ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Latest news list */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-900">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] px-2 py-0.5 text-white bg-gray-900">
                Latest
              </span>
            </div>
            <div className="space-y-0">
              {latestArticles.map((a) => (
                <ArticleCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
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

