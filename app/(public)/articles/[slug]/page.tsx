import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdSlot } from "@/components/public/AdSlot";
import { ArticleCard } from "@/components/public/ArticleCard";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { Share2 } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300; // revalidate every 5 minutes

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  return prisma.article.findFirst({
    where: { slug },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true, color: true } },
      tags: { select: { name: true, slug: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Daily News";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return {
    title: article.metaTitle || `${article.title} | ${appName}`,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: article.author.name ? [article.author.name] : undefined,
      images: article.featuredImage
        ? [{ url: article.featuredImage, width: 1200, height: 630, alt: article.title }]
        : undefined,
      url: `${appUrl}/articles/${article.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.featuredImage ? [article.featuredImage] : undefined,
    },
    alternates: {
      canonical: `${appUrl}/articles/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || article.status !== "PUBLISHED") notFound();

  // Increment view count (fire-and-forget)
  prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Related articles
  const related = await prisma.article.findMany({
    where: {
      categoryId: article.categoryId,
      status: "PUBLISHED",
      NOT: { id: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true, title: true, slug: true, excerpt: true, featuredImage: true,
      publishedAt: true, readingTime: true, isFeatured: true,
      author: { select: { name: true } },
      category: { select: { name: true, slug: true, color: true } },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const articleUrl = `${appUrl}/articles/${article.slug}`;
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(article.title);

  return (
    <div className="bg-[#f7f7f5] min-h-screen">
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── MAIN ARTICLE ──────────────────── */}
          <article className="lg:col-span-2 bg-white px-5 md:px-10 py-8">

            {/* Breadcrumb / category */}
            {article.category && (
              <div className="mb-4">
                <Link
                  href={`/category/${article.category.slug}`}
                  className="text-[11px] font-extrabold uppercase tracking-widest text-white px-2 py-0.5 hover:opacity-90"
                  style={{ backgroundColor: article.category.color }}
                >
                  {article.category.name}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {article.title}
            </h1>

            {/* Excerpt / standfirst */}
            {article.excerpt && (
              <p className="text-lg text-gray-600 leading-relaxed mb-5 border-l-4 border-red-600 pl-4">
                {article.excerpt}
              </p>
            )}

            {/* Byline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 uppercase tracking-wide pb-4 mb-6 border-b border-gray-200">
              <span className="font-semibold text-gray-700">
                {article.author.name || "Staff Reporter"}
              </span>
              {article.publishedAt && (
                <span>{formatDate(article.publishedAt)}</span>
              )}
              {article.readingTime && (
                <span>{article.readingTime} min read</span>
              )}
            </div>

            {/* Featured image */}
            {article.featuredImage && (
              <div className="relative w-full aspect-[16/9] mb-6 overflow-hidden">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Inline ad */}
            <AdSlot position="ARTICLE_INLINE" className="mb-6" />

            {/* Article body */}
            <div
              className="prose prose-lg prose-slate max-w-none
                prose-headings:font-playfair prose-headings:text-gray-900
                prose-p:text-gray-800 prose-p:leading-[1.85]
                prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-red-600 prose-blockquote:text-gray-600
                prose-img:w-full prose-img:my-6"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest self-center mr-1">
                  Topics:
                </span>
                {article.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 border border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Social share */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-200">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold px-3 py-1 bg-blue-600 text-white uppercase tracking-wide hover:bg-blue-700 transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold px-3 py-1 bg-sky-500 text-white uppercase tracking-wide hover:bg-sky-600 transition-colors"
              >
                Twitter
              </a>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-10 pt-8 border-t-2 border-gray-900">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 text-white bg-gray-900">
                    Related
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="default" />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ── SIDEBAR ───────────────────────── */}
          <aside className="space-y-6">
            <AdSlot position="SIDEBAR_TOP" />
            <AdSlot position="SIDEBAR_BOTTOM" />
          </aside>
        </div>
      </div>
    </div>
  );
}
