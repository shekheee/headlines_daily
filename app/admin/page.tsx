import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Clock, RadioIcon, Megaphone, Zap } from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Dashboard — Headlines Daily Admin" };

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [totalArticles, publishedToday, drafts, scheduled, activeAds, breakingCount, recentArticles] =
    await Promise.all([
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({
        where: { status: "PUBLISHED", publishedAt: { gte: todayStart } },
      }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.article.count({
        where: { status: "DRAFT", publishedAt: { not: null, gt: now } },
      }),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.breakingNews.count({ where: { isActive: true } }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 8,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, color: true } },
        },
      }),
    ]);

  return { totalArticles, publishedToday, drafts, scheduled, activeAds, breakingCount, recentArticles };
}

export default async function AdminDashboard() {
  const session = await auth();
  const data = await getDashboardData();

  const stats = [
    { label: "Published Articles", value: data.totalArticles, icon: FileText, color: "text-blue-600" },
    { label: "Published Today", value: data.publishedToday, icon: Eye, color: "text-green-600" },
    { label: "Drafts", value: data.drafts, icon: Clock, color: "text-yellow-600" },
    { label: "Scheduled", value: data.scheduled, icon: RadioIcon, color: "text-purple-600" },
    { label: "Active Ads", value: data.activeAds, icon: Megaphone, color: "text-orange-600" },
    { label: "Breaking News", value: data.breakingCount, icon: Zap, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session?.user?.name}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent articles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Articles</CardTitle>
            <Link
              href="/admin/articles"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentArticles.map((article) => (
              <div key={article.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-medium text-sm hover:underline truncate block"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {article.category && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: article.category.color, color: article.category.color }}
                        className="text-xs"
                      >
                        {article.category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      by {article.author?.name} · {formatTimeAgo(article.publishedAt!)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "New Article", href: "/admin/articles/new", color: "bg-blue-600 hover:bg-blue-700" },
          { label: "Manage Ads", href: "/admin/ads", color: "bg-orange-600 hover:bg-orange-700" },
          { label: "Breaking News", href: "/admin/breaking-news", color: "bg-red-600 hover:bg-red-700" },
          { label: "View Site", href: "/", color: "bg-slate-700 hover:bg-slate-800" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${link.color} text-white rounded-lg p-4 text-center font-medium text-sm transition-colors`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
