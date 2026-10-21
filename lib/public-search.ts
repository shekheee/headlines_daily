import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Share the same small index across all search terms and article existence
// checks. Random crawler queries must not create a new SQL query per URL.
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
