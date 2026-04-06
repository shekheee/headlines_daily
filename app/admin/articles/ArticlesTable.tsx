"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTimeAgo } from "@/lib/utils";
import { Pencil, Trash2, Eye } from "lucide-react";

const STATUS_BADGE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "secondary",
} as const;

export function ArticlesTable({ articles, categories, session }: any) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return articles.filter((a: any) => {
      const matchSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchCategory = categoryFilter === "all" || a.categoryId === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const deleteArticle = async (id: string) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto self-center">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Author</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Updated</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No articles found
                </td>
              </tr>
            )}
            {filtered.map((article: any) => (
              <tr key={article.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 max-w-xs">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-medium hover:underline line-clamp-1"
                  >
                    {article.title}
                  </Link>
                  {article.isFeatured && (
                    <span className="text-xs text-orange-600 font-medium ml-1">Featured</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {article.category ? (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: article.category.color + "22",
                        color: article.category.color,
                      }}
                    >
                      {article.category.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                  {article.author?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[article.status as keyof typeof STATUS_BADGE] as any}>
                    {article.status.charAt(0) + article.status.slice(1).toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                  {formatTimeAgo(article.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {article.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/articles/${article.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/articles/${article.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    {session?.user?.role === "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteArticle(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
