import { getPublicSearchIndex } from "@/lib/public-search";
import { ArticleCard } from "@/components/public/ArticleCard";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 12;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q?.trim();
  return {
    title: q
      ? `Search: ${q} | ${process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate"}`
      : `Search | ${process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate"}`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 200) ?? "";
  const parsedPage = Number(params.page ?? 1);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const term = q.toLocaleLowerCase("en-IN");
  const matches = q ? (await getPublicSearchIndex()).filter((a) =>
    [a.title, a.excerpt ?? "", ...a.tags.map((t) => t.name)]
      .some((value) => value.toLocaleLowerCase("en-IN").includes(term))
  ) : [];
  const total = matches.length;
  const articles = matches.slice(skip, skip + PAGE_SIZE);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">
        {q ? `Results for "${q}"` : "Search"}
      </h1>

      {/* Search form */}
      <form method="GET" className="flex gap-2 mb-8 max-w-lg">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search articles..."
          className="flex-1 border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
        >
          Search
        </button>
      </form>

      {q && (
        <p className="text-slate-500 text-sm mb-6">
          {total} result{total !== 1 ? "s" : ""} found
        </p>
      )}

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} variant="default" />
          ))}
        </div>
      ) : q ? (
        <p className="text-slate-400">No articles match your search.</p>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/search?q=${encodeURIComponent(q)}&page=${p}`}
              className={`px-3 py-1 rounded text-sm font-medium border transition-colors ${
                p === page
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
