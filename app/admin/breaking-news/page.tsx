import { prisma } from "@/lib/prisma";
import { BreakingNewsManager } from "./BreakingNewsManager";

export const metadata = { title: "Breaking News — Lok Mandate Admin" };

export default async function BreakingNewsPage() {
  const items = await prisma.breakingNews.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Breaking News</h1>
        <p className="text-muted-foreground mt-1">
          Manage the scrolling breaking news ticker on the public site
        </p>
      </div>
      <BreakingNewsManager items={items} />
    </div>
  );
}
