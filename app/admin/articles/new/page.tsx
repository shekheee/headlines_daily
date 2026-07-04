import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../ArticleForm";

export const metadata = { title: "New Article — Lok Mandate Admin" };

async function getFormData() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, tags };
}

export default async function NewArticlePage() {
  const { categories, tags } = await getFormData();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Article</h1>
        <p className="text-muted-foreground mt-1">Write and publish a new article</p>
      </div>
      <ArticleForm categories={categories} tags={tags} />
    </div>
  );
}
