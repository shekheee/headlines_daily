import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { estimateReadingTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const authorId = searchParams.get("authorId");
  const search = searchParams.get("search");
  const skip = (page - 1) * limit;

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";

  const where: any = {};
  if (status) {
    where.status = status;
  } else if (!isAdmin) {
    // Public: only published & not future-dated
    where.status = "PUBLISHED";
    where.publishedAt = { lte: new Date() };
  }
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    content,
    excerpt,
    featuredImage,
    featuredImageAlt,
    status,
    publishedAt,
    isFeatured,
    categoryId,
    tagIds,
    metaTitle,
    metaDescription,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  // Generate unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const existing = await prisma.article.findFirst({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const readingTime = estimateReadingTime(content);

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      status: status || "DRAFT",
      publishedAt: publishedAt ? new Date(publishedAt) : status === "PUBLISHED" ? new Date() : null,
      isFeatured: isFeatured || false,
      readingTime,
      categoryId: categoryId || null,
      authorId: session.user.id,
      metaTitle,
      metaDescription,
      tags: tagIds?.length
        ? { connect: tagIds.map((id: string) => ({ id })) }
        : undefined,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: true,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
