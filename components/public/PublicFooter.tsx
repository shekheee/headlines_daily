import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/public/BrandMark";
import { Rss } from "lucide-react";

async function getFooterCategories() {
  return prisma.category.findMany({
    where: { articles: { some: { status: "PUBLISHED" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 12,
  });
}

export async function PublicFooter() {
  const categories = await getFooterCategories();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Lok Mandate";

  return (
    <footer className="bg-[#111] text-gray-400">
      {/* Top divider with logo */}
      <div className="border-b border-gray-800">
        <div className="container px-4 py-6 max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label={appName}>
            <BrandMark className="h-7 w-7" />
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {appName}
            </span>
          </Link>
          <Link href="/feed.xml" aria-label="RSS Feed" className="text-gray-500 hover:text-red-500 transition-colors">
            <Rss className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Columns */}
      <div className="container px-4 py-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm text-gray-500 leading-relaxed">
              Independent India news — politics, elections, business and the stories that shape the nation.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white mb-4">
              Sections
            </h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More topics */}
          {categories.length > 6 && (
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white mb-4">
                More Topics
              </h3>
              <ul className="space-y-2.5">
                {categories.slice(6, 12).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Advertise", href: "/advertise" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Use", href: "/terms" },
                { label: "Sitemap", href: "/sitemap.xml" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-4 text-center text-[11px] text-gray-600 uppercase tracking-widest">
        © {new Date().getFullYear()} {appName}. All rights reserved.
      </div>
    </footer>
  );
}
