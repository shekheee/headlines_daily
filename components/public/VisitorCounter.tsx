"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Users } from "lucide-react";

interface Counts {
  totalViews: number;
  uniqueVisitors: number;
}

const fmt = new Intl.NumberFormat("en-IN");

export function VisitorCounter() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    // Guard against React's double-invoked effects (dev/StrictMode) so a single
    // page load records exactly one visit.
    if (recorded.current) return;
    recorded.current = true;

    fetch("/api/visit", { method: "POST", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Counts | null) => {
        if (data && typeof data.totalViews === "number") setCounts(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-center gap-5 py-4 text-[11px] uppercase tracking-widest text-gray-500">
      <span className="flex items-center gap-1.5" title="Total page views">
        <Eye className="h-3.5 w-3.5 text-gray-600" aria-hidden />
        <span className="font-semibold text-gray-300 tabular-nums">
          {counts ? fmt.format(counts.totalViews) : "—"}
        </span>
        <span className="hidden sm:inline">Visits</span>
      </span>
      <span className="h-3 w-px bg-gray-700" aria-hidden />
      <span className="flex items-center gap-1.5" title="Unique visitors">
        <Users className="h-3.5 w-3.5 text-gray-600" aria-hidden />
        <span className="font-semibold text-gray-300 tabular-nums">
          {counts ? fmt.format(counts.uniqueVisitors) : "—"}
        </span>
        <span className="hidden sm:inline">Unique Visitors</span>
      </span>
    </div>
  );
}
