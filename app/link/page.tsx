import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/public/BrandMark";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate";

export const metadata: Metadata = {
  title: `${APP_NAME} — Links`,
  description: "Latest headlines, Indian politics, and stories from history.",
  robots: { index: false, follow: true },
};

export const revalidate = 120;

async function getData() {
  const [categories, latest] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, articles: { some: { status: "PUBLISHED" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6,
      select: { id: true, name: true, slug: true, color: true },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { id: true, title: true, slug: true, category: { select: { name: true, color: true } } },
    }),
  ]);
  return { categories, latest };
}

export default async function LinkInBioPage() {
  const { categories, latest } = await getData();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0b10] via-[#12121a] to-[#0b0b10] text-white">
      <div className="mx-auto w-full max-w-md px-5 py-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <BrandMark className="h-14 w-14 text-white" />
          <h1
            className="mt-3 text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {APP_NAME}
          </h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400">
            Independent · India · News
          </p>
        </div>

        {/* Freshest stories */}
        {latest.length > 0 && (
          <section className="mt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Latest stories</p>
            <div className="space-y-3">
              {latest.map((a) => (
                <Link
                  key={a.id}
                  href={`/articles/${a.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.09] active:bg-white/[0.12]"
                >
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ color: a.category?.color || "#f59e0b" }}
                  >
                    {a.category?.name || "News"}
                  </span>
                  <span className="mt-1 block text-[15px] font-semibold leading-snug text-white">{a.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Primary destinations */}
        <section className="mt-8 space-y-3">
          <BioButton href="/" label="📰  Latest Headlines" primary />
          {categories.map((c) => (
            <BioButton key={c.id} href={`/category/${c.slug}`} label={c.name} dot={c.color} />
          ))}
        </section>

        <p className="mt-10 text-center text-xs text-gray-500">
          <Link href="/" className="hover:text-white">
            lokmandate.com
          </Link>
        </p>
      </div>
    </main>
  );
}

function BioButton({ href, label, primary, dot }: { href: string; label: string; primary?: boolean; dot?: string }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-4 text-center text-[15px] font-bold text-black transition-transform active:scale-[0.98]"
          : "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.09] active:bg-white/[0.12]"
      }
    >
      {dot && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
      {label}
    </Link>
  );
}
