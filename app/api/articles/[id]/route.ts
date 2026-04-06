import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { estimateReadingTime } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const article = await prisma.article.findFirst({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.article.findFirst({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only admin/editor or the article's own author can edit
  const canEdit =
    session.user.role === "ADMIN" ||
    session.user.role === "EDITOR" ||
    existing.authorId === session.user.id;

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Regenerate slug if title changed
  let slug = existing.slug;
  if (title && title !== existing.title) {
    slug = slugify(title, { lower: true, strict: true });
    const conflict = await prisma.article.findFirst({
      where: { slug, NOT: { id } },
    });
    if (conflict) slug = `${slug}-${Date.now()}`;
  }

  const readingTime = content ? estimateReadingTime(content) : existing.readingTime;

  // If status transitions to PUBLISHED and no publishedAt set, set it now
  let resolvedPublishedAt = publishedAt !== undefined ? (publishedAt ? new Date(publishedAt) : null) : existing.publishedAt;
  if (status === "PUBLISHED" && !resolvedPublishedAt) {
    resolvedPublishedAt = new Date();
  }

  const updated = await prisma.article.update({
    where: { id },
    data: {
      ...(title && { title }),
      slug,
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(featuredImageAlt !== undefined && { featuredImageAlt }),
      ...(status && { status }),
      publishedAt: resolvedPublishedAt,
      ...(isFeatured !== undefined && { isFeatured }),
      ...(readingTime && { readingTime }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(tagIds !== undefined && {
        tags: { set: tagIds.map((tid: string) => ({ id: tid })) },
      }),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
