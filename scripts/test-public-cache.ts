// Exercise the installed Next cache implementation with a fake SQL delegate.
// No database connection or credentials are needed.
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";

async function main() {
  Object.assign(globalThis, { AsyncLocalStorage });
  process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:1/cache_test";
  const { workAsyncStorage } = await import("next/dist/server/app-render/work-async-storage.external.js");
  const { prisma } = await import("@/lib/prisma");
  const { getPublicSearchIndex, getPublicCategoryArticles, getPublicRelatedArticles } = await import("@/lib/public-search");
  const entries = new Map<string, unknown>();
  const incrementalCache = {
    generateCacheKey: async (key: string) => key,
    get: async (key: string) => entries.has(key) ? { value: entries.get(key), isStale: false } : null,
    set: async (key: string, value: unknown) => { entries.set(key, value); },
  };
  const data = Array.from({ length: 205 }, (_, i) => ({
    id: `article-${i}`, slug: `story-${i}`, title: `Story ${i}`,
    categoryId: i < 200 ? "india" : "history", tags: [],
  }));
  let indexQueries = 0;
  let relatedQueries = 0;
  const original = prisma.article.findMany;
  Reflect.set(prisma.article, "findMany", async (query: { take: number; skip?: number; where?: { categoryId?: string | null } }) => {
    if (query.take === 200) {
      indexQueries++;
      return data.slice(query.skip ?? 0, (query.skip ?? 0) + 200);
    }
    assert.equal(query.take, 4, "Related queries must be bounded to four rows");
    relatedQueries++;
    return data.filter((article) => article.categoryId === query.where?.categoryId).slice(0, 4);
  });
  const store = { incrementalCache, route: "/cache-regression", pendingRevalidates: {} } as unknown as Parameters<typeof workAsyncStorage.run>[0];
  try {
    await workAsyncStorage.run(store, async () => {
      assert.equal((await getPublicSearchIndex()).length, 205);
      assert.equal(indexQueries, 2, "Initial fill should fetch exactly two chunks");
      await getPublicSearchIndex();
      const first = await getPublicCategoryArticles("india", 1);
      const second = await getPublicCategoryArticles("india", 2);
      const history = await getPublicCategoryArticles("history", 1);
      assert.equal(first.total, 200);
      assert.equal(first.articles.length, 12);
      assert.equal(second.articles[0].id, "article-12");
      assert.equal(history.total, 5);
      assert.equal(indexQueries, 2, "Different category pages must reuse the warm index, never bypass it");

      const related = await getPublicRelatedArticles("article-0", "india");
      assert.equal(related.length, 3);
      assert.ok(related.every((article) => article.id !== "article-0"));
      await getPublicRelatedArticles("article-1", "india");
      assert.equal(relatedQueries, 1, "Different articles in a category must share one bounded SQL result");
      await getPublicRelatedArticles("article-200", "history");
      assert.equal(relatedQueries, 2);
      assert.equal(indexQueries, 2, "Article-related reads must never reload the full index");
    });
    console.log("PASS: shared index, category pagination, bounded related reads, and article exclusion (zero Neon queries)");
  } finally {
    Reflect.set(prisma.article, "findMany", original);
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
