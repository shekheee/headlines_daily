import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./CategoriesManager";

export const metadata = { title: "Categories — Headlines Daily Admin" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { articles: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground mt-1">
          Manage news categories and their colors
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  );
}
