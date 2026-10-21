import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getSavedCounts = unstable_cache(async () => {
  return await prisma.siteCounter.findUnique({
    where: { id: "global" },
    select: { totalViews: true, uniqueVisitors: true },
  }) ?? { totalViews: 0, uniqueVisitors: 0 };
}, ["saved-visitor-counts"], { revalidate: 86400 });

// Live mode writes once per browser/day; budget mode reads cached saved totals.
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "lm_vid"; // long-lived: marks a unique browser
const SESSION_COOKIE = "lm_sess"; // short-lived: also caches the display counts
const ONE_YEAR = 60 * 60 * 24 * 365;
const SESSION_TTL = 60 * 60 * 24; // one DB touch per browser per day at most

/**
 * Records a visit and returns the running totals.
 *
 * Compute-aware design: our DB is Neon (billed by compute *uptime*, not queries),
 * so a per-page-view write defeats ISR caching and keeps the compute awake. We
 * therefore touch the DB AT MOST ONCE per day per browser:
 *   - uniqueVisitors increments only the first time a browser is ever seen.
 *   - totalViews increments once per session (so the metric counts visits/sessions).
 *   - Within a session we return the counts cached in the session cookie — zero DB.
 */
export async function POST() {
  try {
    // Per-browser throttling still wakes Neon for EVERY new visitor. Keep the
    // historical totals without traffic-driven writes on the free compute tier.
    if (process.env.ENABLE_LIVE_VISITOR_COUNTS !== "true") {
      return NextResponse.json({ ...await getSavedCounts(), live: false });
    }
    const store = await cookies();
    const cached = store.get(SESSION_COOKIE)?.value;

    // Still in an active session → serve the cached counts, no DB round-trip.
    if (cached) {
      const [tv, uv] = cached.split(".").map((n) => Number(n));
      if (Number.isFinite(tv) && Number.isFinite(uv)) {
        return NextResponse.json({ totalViews: tv, uniqueVisitors: uv, live: true });
      }
    }

    const isNewVisitor = !store.get(VISITOR_COOKIE)?.value;

    const counter = await prisma.siteCounter.upsert({
      where: { id: "global" },
      create: { id: "global", totalViews: 1, uniqueVisitors: isNewVisitor ? 1 : 0 },
      update: {
        totalViews: { increment: 1 },
        ...(isNewVisitor ? { uniqueVisitors: { increment: 1 } } : {}),
      },
      select: { totalViews: true, uniqueVisitors: true },
    });

    const res = NextResponse.json({ ...counter, live: true });
    // Cache the fresh counts in the session cookie so subsequent views this
    // session need no DB access at all.
    res.cookies.set(SESSION_COOKIE, `${counter.totalViews}.${counter.uniqueVisitors}`, {
      maxAge: SESSION_TTL,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    if (isNewVisitor) {
      res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
        maxAge: ONE_YEAR * 2,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return res;
  } catch {
    return NextResponse.json({ totalViews: null, uniqueVisitors: null, live: false }, { status: 503 });
  }
}
