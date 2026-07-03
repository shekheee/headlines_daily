// Weekly Instagram growth report: follower trend, best posts/formats/times, and
// plain-English recommendations for what to double down on next week.
import { prisma } from "@/lib/prisma";

export interface PostRow {
  igMediaId: string;
  kind: string;
  format: string;
  theme: string | null;
  articleSlug: string | null;
  postedAt: Date;
  engagement: number;
  likes: number;
  reach: number;
  saved: number;
  comments: number;
}

export interface Recommendation {
  text: string;
}

export interface WeeklyReport {
  generatedAt: string;
  followers: number | null;
  followersDelta7d: number | null;
  followerSeries: { day: string; followers: number }[];
  postsLast7d: number;
  topPosts: PostRow[];
  byFormat: { format: string; posts: number; avgEngagement: number }[];
  byTheme: { theme: string; posts: number; avgEngagement: number }[];
  bestSlotHourUtc: number | null;
  recommendations: string[];
}

const eng = (p: { likes: number | null; saved: number | null; shares: number | null; comments: number | null }) =>
  (p.likes ?? 0) + (p.saved ?? 0) + (p.shares ?? 0) + (p.comments ?? 0);

export async function buildWeeklyReport(): Promise<WeeklyReport> {
  const since = new Date(Date.now() - 7 * 86400_000);

  const [snapshots, posts] = await Promise.all([
    prisma.accountSnapshot.findMany({ orderBy: { day: "asc" }, take: 60 }),
    prisma.socialPost.findMany({ where: { postedAt: { gte: since } }, orderBy: { postedAt: "desc" } }),
  ]);

  const followerSeries = snapshots.map((s) => ({ day: s.day, followers: s.followers }));
  const latest = snapshots.at(-1)?.followers ?? null;
  // Compare to the snapshot closest to 7 days ago.
  const weekAgoDay = new Date(Date.now() - 7 * 86400_000 + 5.5 * 3600_000).toISOString().slice(0, 10);
  const weekAgoSnap = snapshots.find((s) => s.day >= weekAgoDay) ?? snapshots[0];
  const followersDelta7d = latest != null && weekAgoSnap ? latest - weekAgoSnap.followers : null;

  const rows: PostRow[] = posts.map((p) => ({
    igMediaId: p.igMediaId,
    kind: p.kind,
    format: p.format || p.kind,
    theme: p.theme,
    articleSlug: p.articleSlug,
    postedAt: p.postedAt,
    engagement: eng(p),
    likes: p.likes ?? 0,
    reach: p.reach ?? 0,
    saved: p.saved ?? 0,
    comments: p.comments ?? 0,
  }));

  const topPosts = [...rows].sort((a, b) => b.engagement - a.engagement).slice(0, 5);

  const group = (key: (p: PostRow) => string | null) => {
    const m = new Map<string, { posts: number; total: number }>();
    for (const p of rows) {
      const k = key(p);
      if (!k) continue;
      const cur = m.get(k) ?? { posts: 0, total: 0 };
      cur.posts++;
      cur.total += p.engagement;
      m.set(k, cur);
    }
    return [...m.entries()]
      .map(([k, v]) => ({ key: k, posts: v.posts, avgEngagement: Math.round((v.total / v.posts) * 10) / 10 }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);
  };

  const byFormat = group((p) => p.format).map((x) => ({ format: x.key, posts: x.posts, avgEngagement: x.avgEngagement }));
  const byTheme = group((p) => p.theme).map((x) => ({ theme: x.key, posts: x.posts, avgEngagement: x.avgEngagement }));

  // Best posting slot by average engagement.
  const slots = new Map<number, { posts: number; total: number }>();
  for (const p of posts) {
    if (p.slotHour == null) continue;
    const cur = slots.get(p.slotHour) ?? { posts: 0, total: 0 };
    cur.posts++;
    cur.total += eng(p);
    slots.set(p.slotHour, cur);
  }
  const bestSlot = [...slots.entries()].sort((a, b) => b[1].total / b[1].posts - a[1].total / a[1].posts)[0];
  const bestSlotHourUtc = bestSlot ? bestSlot[0] : null;

  // Recommendations.
  const recs: string[] = [];
  if (byFormat[0]) recs.push(`"${byFormat[0].format}" is your best format (avg ${byFormat[0].avgEngagement}). Post more of these.`);
  if (byFormat.length > 1 && byFormat.at(-1)!.avgEngagement < byFormat[0].avgEngagement * 0.4)
    recs.push(`"${byFormat.at(-1)!.format}" is underperforming — cut back or rework it.`);
  if (byTheme[0]) recs.push(`Top theme: "${byTheme[0].theme}". Lean into this topic.`);
  if (bestSlotHourUtc != null) {
    const ist = (bestSlotHourUtc + 5.5) % 24;
    recs.push(`Best time so far: ~${String(Math.floor(ist)).padStart(2, "0")}:${ist % 1 ? "30" : "00"} IST.`);
  }
  if (rows.length < 7) recs.push("Not much data yet — keep posting daily; the report sharpens after ~2 weeks.");
  if (followersDelta7d != null && followersDelta7d <= 0) recs.push("Followers flat this week: add trending audio to Reels and do 15 min/day of manual commenting on niche accounts.");
  recs.push("The first 100 followers are driven by manual engagement + Reels reach, not autoposting alone.");

  return {
    generatedAt: new Date().toISOString(),
    followers: latest,
    followersDelta7d,
    followerSeries,
    postsLast7d: rows.length,
    topPosts,
    byFormat,
    byTheme,
    bestSlotHourUtc,
    recommendations: recs,
  };
}
