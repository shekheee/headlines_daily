import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, color, parentId, sortOrder } = body;

  const data: any = {};
  if (name) {
    data.name = name;
    data.slug = slugify(name, { lower: true, strict: true });
  }
  if (description !== undefined) data.description = description;
  if (color) data.color = color;
  if (parentId !== undefined) data.parentId = parentId || null;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const updated = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  // Unlink articles before deleting
  await prisma.article.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
