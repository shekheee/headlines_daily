import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getActiveBreakingNews = unstable_cache(
  async () => {
    const now = new Date();
    return prisma.breakingNews.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["active-breaking-news"],
  { revalidate: 3600, tags: ["breaking-news"] }
);

export async function GET() {
  const items = await getActiveBreakingNews();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.breakingNews.create({ data: body });
  return NextResponse.json(item, { status: 201 });
}
