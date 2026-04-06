import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const [totalArticles, publishedToday, drafts, scheduled, activeAds, recentArticles] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({
        where: {
          status: "PUBLISHED",
          publishedAt: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.article.count({
        where: {
          status: "DRAFT",
          publishedAt: { not: null, gt: new Date() },
        },
      }),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, color: true } },
        },
      }),
    ]);

  return NextResponse.json({
    totalArticles,
    publishedToday,
    drafts,
    scheduled,
    activeAds,
    recentArticles,
  });
}
