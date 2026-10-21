import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryHeader } from "@/components/public/CategoryHeader";
import { ArticleCard } from "@/components/public/ArticleCard";
import { AdSlot } from "@/components/public/AdSlot";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getPublicSearchIndex } from "@/lib/public-search";

export const revalidate = 21600;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 12;

const getCategories = unstable_cache(async () => prisma.category.findMany(),
  ["public-category-list"], { revalidate: 86400, tags: ["categories"] });

async function getCategory(slug: string) {
  return (await getCategories()).find((category) => category.slug === slug);
}

const getCategoryArticles = unstable_cache(async (categoryId: string, page: number) => {
  const skip = (page - 1) * PAGE_SIZE;
  const matches = (await getPublicSearchIndex()).filter((a) => a.categoryId === categoryId);
  return { articles: matches.slice(skip, skip + PAGE_SIZE), total: matches.length };
}, ["category-articles-v2"], { revalidate: 21600, tags: ["articles"] });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not Found" };
  return {
    title: `${category.name} | ${process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate"}`,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const parsedPage = Number(pageParam ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { articles, total } = await getCategoryArticles(category.id, page);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-[#f7f7f5] min-h-screen">
      <CategoryHeader
        name={category.name}
        description={category.description}
        color={category.color}
      />

      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <AdSlot position="HEADER" className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {articles.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">No articles in this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="default" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-1.5 mt-10 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/category/${category.slug}?page=${p}`}
                    className={`px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide border transition-colors ${
                      p === page
                        ? "text-white border-transparent"
                        : "border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900"
                    }`}
                    style={p === page ? { backgroundColor: category.color, borderColor: category.color } : {}}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <AdSlot position="SIDEBAR_TOP" />
            <AdSlot position="SIDEBAR_BOTTOM" />
          </aside>
        </div>
      </div>
    </div>
  );
}
