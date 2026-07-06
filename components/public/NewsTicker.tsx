"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export interface TickerItem {
  id: string;
  title: string;
  slug: string;
  category: { name: string; color: string } | null;
}

/**
 * Slim "moving news" strip for the top of the homepage: a fixed LATEST label
 * and a gentle, continuously scrolling row of the freshest headlines. Motion
 * pauses on hover so a reader can click a headline.
 */
export function NewsTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  // Duplicate the list so the linear scroll loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div className="mb-5 flex items-stretch overflow-hidden rounded-sm border border-gray-200 bg-white">
      <div className="flex items-center gap-1.5 bg-red-600 px-3 text-[11px] font-bold uppercase tracking-widest text-white shrink-0">
        <Zap className="h-3 w-3" />
        Latest
      </div>
      <div className="relative flex-1 overflow-hidden">
        {/* soft fade at the trailing edge */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-ticker-scroll items-center whitespace-nowrap py-2 pl-4">
          {loop.map((item, i) => (
            <span key={`${item.id}-${i}`} className="flex items-center">
              <span
                className="mr-2 inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: item.category?.color || "#dc2626" }}
              />
              <Link
                href={`/articles/${item.slug}`}
                className="text-[13px] font-semibold text-gray-800 hover:text-red-600 transition-colors"
              >
                {item.title}
              </Link>
              <span className="mx-6 text-gray-300">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
