import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BreakingNewsTicker } from "@/components/public/BreakingNewsTicker";
import { Search } from "lucide-react";

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 9,
  });
}

export async function PublicHeader() {
  const categories = await getCategories();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Headlines Daily";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white">
      {/* Masthead */}
      <div className="border-b border-gray-200">
        <div className="container px-4 flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            <span className="text-red-600">{appName.slice(0, 1)}</span>
            {appName.slice(1)}
          </Link>

          {/* Right: date + search */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden md:block">{today}</span>
            <Link
              href="/search"
              aria-label="Search"
              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Category nav — sticky black bar */}
      <nav className="bg-[#111] sticky top-0 z-40">
        <div className="container px-4 flex items-center overflow-x-auto scrollbar-hide">
          <Link
            href="/"
            className="px-3 py-3 text-[13px] font-semibold uppercase tracking-wide text-white hover:text-red-400 whitespace-nowrap border-b-2 border-transparent hover:border-red-500 transition-colors"
          >
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="px-3 py-3 text-[13px] font-semibold uppercase tracking-wide text-gray-300 hover:text-white whitespace-nowrap border-b-2 border-transparent hover:border-red-500 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Breaking news ticker */}
      <BreakingNewsTicker />
    </header>
  );
}
