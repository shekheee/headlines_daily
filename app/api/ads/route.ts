import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const position = searchParams.get("position");
  const activeOnly = searchParams.get("active") !== "false";
  const now = new Date();

  const where: any = {};
  if (position) where.position = position;
  if (activeOnly) {
    where.isActive = true;
    where.OR = [
      { startDate: null },
      { startDate: { lte: now } },
    ];
    where.AND = [
      {
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    ];
  }

  const ads = await prisma.ad.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const ad = await prisma.ad.create({ data: body });
  return NextResponse.json(ad, { status: 201 });
}
