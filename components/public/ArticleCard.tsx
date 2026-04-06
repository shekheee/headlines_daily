import Link from "next/link";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/utils";

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: Date | null;
    readingTime: number | null;
    isFeatured: boolean;
    author: { name: string | null };
    category: { name: string; slug: string; color: string } | null;
  };
  variant?: "default" | "hero" | "compact";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  /* ── HERO ──────────────────────────────────────────────────── */
  if (variant === "hero") {
    return (
      <Link href={`/articles/${article.slug}`} className="group block relative overflow-hidden bg-gray-900">
        <div className="relative w-full min-h-[400px] md:min-h-[480px]">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover opacity-75 group-hover:opacity-70 transition-opacity duration-300"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gray-800" />
          )}
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white">
            {article.category && (
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 bg-red-600">
                {article.category.name}
              </span>
            )}
            <h2
              className="text-2xl md:text-4xl font-bold leading-tight mb-3 group-hover:text-gray-100 transition-colors"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4 hidden sm:block">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-[12px] text-gray-400 uppercase tracking-wide">
              <span>{article.author.name || "Staff"}</span>
              {article.publishedAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-500 inline-block" />
                  <span>{formatTimeAgo(article.publishedAt)}</span>
                </>
              )}
              {article.readingTime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-500 inline-block" />
                  <span>{article.readingTime} min read</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ── COMPACT ───────────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="group flex gap-3 items-start py-3 border-b border-gray-100 last:border-0"
      >
        {article.featuredImage && (
          <div className="relative w-20 h-14 shrink-0 overflow-hidden bg-gray-100">
            <Image src={article.featuredImage} alt={article.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {article.category && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: article.category.color }}
            >
              {article.category.name}
            </span>
          )}
          <h4
            className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5 text-gray-900 group-hover:text-red-600 transition-colors"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {article.title}
          </h4>
          {article.publishedAt && (
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wide">
              {formatTimeAgo(article.publishedAt)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  /* ── DEFAULT ───────────────────────────────────────────────── */
  return (
    <Link href={`/articles/${article.slug}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9] mb-3 bg-gray-100">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      {/* Category label */}
      {article.category && (
        <span
          className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
          style={{ color: article.category.color }}
        >
          {article.category.name}
        </span>
      )}

      {/* Title */}
      <h3
        className="font-bold text-gray-900 leading-snug mb-1.5 line-clamp-3 group-hover:text-red-700 transition-colors text-[15px] md:text-base"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {article.title}
      </h3>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-[13px] text-gray-500 line-clamp-2 mb-2 leading-relaxed hidden sm:block">
          {article.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase tracking-wide">
        <span>{article.author.name || "Staff"}</span>
        {article.publishedAt && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
            <span>{formatTimeAgo(article.publishedAt)}</span>
          </>
        )}
      </div>
    </Link>
  );
}
