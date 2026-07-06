"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { name: string; color: string } | null;
}

const INTERVAL = 5000;

/** Auto-rotating hero carousel of the freshest news. Pauses on hover/focus. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((next: number) => setI(((next % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    timer.current = setInterval(() => setI((c) => (c + 1) % n), INTERVAL);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, n]);

  if (n === 0) return null;

  return (
    <div
      className="relative overflow-hidden bg-gray-900 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Top stories"
    >
      <div className="relative min-h-[400px] md:min-h-[480px]">
        {slides.map((s, idx) => (
          <Link
            key={s.id}
            href={`/articles/${s.slug}`}
            className="absolute inset-0 block transition-opacity duration-700 ease-out"
            style={{ opacity: idx === i ? 1 : 0, pointerEvents: idx === i ? "auto" : "none" }}
            aria-hidden={idx !== i}
            tabIndex={idx === i ? 0 : -1}
          >
            {s.featuredImage ? (
              <Image
                src={s.featuredImage}
                alt={s.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover opacity-75"
                priority={idx === 0}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 pb-14 md:pb-16 text-white">
              {s.category && (
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 bg-red-600">
                  {s.category.name}
                </span>
              )}
              <h2
                className="text-2xl md:text-4xl font-bold leading-tight mb-2 max-w-3xl"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {s.title}
              </h2>
              {s.excerpt && (
                <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-2xl hidden sm:block">{s.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {n > 1 && (
        <>
          {/* Prev / next */}
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="Previous story"
            className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            aria-label="Next story"
            className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(idx)}
                aria-label={`Go to story ${idx + 1}`}
                aria-current={idx === i ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
