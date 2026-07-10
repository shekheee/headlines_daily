import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Never cache — every hit must record a fresh visit.
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "lm_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Records a visit and returns the running totals.
 *   - totalViews increments on every call (each page view)
 *   - uniqueVisitors increments only the first time a browser is seen
 *     (tracked with a long-lived first-party cookie)
 */
export async function POST() {
  try {
    const store = await cookies();
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

    const res = NextResponse.json(counter);
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
    return NextResponse.json({ totalViews: 0, uniqueVisitors: 0 }, { status: 200 });
  }
}
