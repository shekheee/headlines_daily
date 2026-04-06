import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArticleForm } from "../ArticleForm";

async function getArticle(id: string) {
  return prisma.article.findFirst({
    where: { id },
    include: {
      tags: { select: { id: true, name: true, slug: true } },
      category: true,
    },
  });
}

async function getFormData() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, tags };
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, { categories, tags }] = await Promise.all([
    getArticle(id),
    getFormData(),
  ]);

  if (!article) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Article</h1>
        <p className="text-muted-foreground mt-1 line-clamp-1">{article.title}</p>
      </div>
      <ArticleForm article={article} categories={categories} tags={tags} />
    </div>
  );
}
