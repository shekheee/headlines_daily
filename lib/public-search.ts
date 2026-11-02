import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Share this index between search and category pagination only. Call it outside
// other unstable_cache scopes: nested calls bypass the inner cache in Next 16.
// Each chunk stays comfortably below Vercel's 2 MB Data Cache entry limit.
const getSearchChunk = unstable_cache(async (page: number) => {
  return prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: page * 200,
    take: 200,
    select: {
      id: true, title: true, slug: true, excerpt: true, featuredImage: true,
      publishedAt: true, readingTime: true, isFeatured: true, categoryId: true,
      author: { select: { name: true } },
      category: { select: { name: true, slug: true, color: true } },
      tags: { select: { name: true } },
    },
  });
}, ["public-search-index"], { revalidate: 21600, tags: ["articles"] });

export async function getPublicSearchIndex() {
  const articles = [];
  for (let page = 0; ; page++) {
    const chunk = await getSearchChunk(page);
    articles.push(...chunk);
    if (chunk.length < 200) break;
  }
  return articles;
}

export async function getPublicCategoryArticles(categoryId: string, page: number, pageSize = 12) {
  const matches = (await getPublicSearchIndex()).filter((a) => a.categoryId === categoryId);
  const skip = (page - 1) * pageSize;
  return { articles: matches.slice(skip, skip + pageSize), total: matches.length };
}

// One bounded query per category, not a complete index scan per article.
const getRelatedCandidates = unstable_cache(async (categoryId: string | null) => {
  return prisma.article.findMany({
    where: { categoryId, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: 4,
    select: {
      id: true, title: true, slug: true, excerpt: true, featuredImage: true,
      publishedAt: true, readingTime: true, isFeatured: true,
      author: { select: { name: true } },
      category: { select: { name: true, slug: true, color: true } },
    },
  });
}, ["related-category-candidates"], { revalidate: 21600, tags: ["related-articles"] });

export async function getPublicRelatedArticles(articleId: string, categoryId: string | null) {
  return (await getRelatedCandidates(categoryId)).filter((a) => a.id !== articleId).slice(0, 3);
}
