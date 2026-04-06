"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export function BreakingNewsTicker() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/breaking-news")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-red-600 text-white overflow-hidden">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 bg-red-800 px-4 py-2 text-xs font-bold uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
          <Zap className="h-3 w-3" />
          Breaking
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-ticker-scroll hover:[animation-play-state:paused] py-2 px-4 text-sm gap-12">
            {/* Duplicate content for seamless looping */}
            {[...items, ...items].map((item, i) => (
              <span key={`${item.id}-${i}`}>
                {item.url ? (
                  <Link href={item.url} className="hover:underline">
                    {item.text}
                  </Link>
                ) : (
                  item.text
                )}
                {i < [...items, ...items].length - 1 && (
                  <span className="mx-6 opacity-50">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
