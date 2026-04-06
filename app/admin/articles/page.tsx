import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { ArticlesTable } from "./ArticlesTable";

export const metadata = { title: "Articles — Headlines Daily Admin" };

async function getArticles() {
  return prisma.article.findMany({
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function ArticlesPage() {
  const [articles, categories] = await Promise.all([getArticles(), getCategories()]);
  const session = await auth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground mt-1">{articles.length} total articles</p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      <ArticlesTable articles={articles} categories={categories} session={session} />
    </div>
  );
}
