// Weekly Instagram growth report: follower trend, best posts/formats/times, and
// plain-English recommendations for what to double down on next week.
import { prisma } from "@/lib/prisma";
import { getMediaPermalink } from "@/lib/instagram";

// "Worst performers" tuning. Instagram has no archive API (archive is app-only),
// so we surface the weakest posts with a direct link for a 1-tap manual archive.
const WORST_WINDOW_DAYS = 45; // how far back to consider
const WORST_MATURE_DAYS = 10; // ignore posts too fresh to judge fairly
const WORST_MIN_SAMPLE = 8; // need enough mature posts before "below average" is meaningful
const WORST_FRACTION_OF_AVG = 0.5; // flag posts under half the recent average reach
const WORST_MAX = 12; // never surface more than this many at once

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

/** A low-view post worth archiving (kept separate: ranked by reach, not engagement). */
export interface WorstPost {
  igMediaId: string;
  format: string;
  postedAt: Date;
  reach: number;
  likes: number;
  engagement: number;
  pctOfAvg: number; // reach as a % of the account's recent average reach
  permalink: string | null; // tap to open → Archive in the app
  articleSlug: string | null;
  theme: string | null;
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
  worstPosts: WorstPost[];
  recentAvgReach: number | null;
  recommendations: string[];
}

const eng = (p: { likes: number | null; saved: number | null; shares: number | null; comments: number | null }) =>
  (p.likes ?? 0) + (p.saved ?? 0) + (p.shares ?? 0) + (p.comments ?? 0);

/**
 * The weakest posts by reach/views over the last ~45 days — the ones worth
 * archiving to keep the grid strong. We only judge posts old enough to have
 * matured, ignore ephemeral Stories, and flag those pulling well below the
 * account's own recent average (roughly the bottom band). Permalinks are
 * attached so you can open each one and tap Archive in the app.
 */
async function computeWorstPosts(): Promise<{ worstPosts: WorstPost[]; recentAvgReach: number | null }> {
  const since = new Date(Date.now() - WORST_WINDOW_DAYS * 86400_000);
  const until = new Date(Date.now() - WORST_MATURE_DAYS * 86400_000);
  const mature = await prisma.socialPost.findMany({
    where: {
      postedAt: { gte: since, lte: until },
      kind: { not: "story" }, // Stories expire in 24h — nothing to archive
      reach: { gt: 0 }, // needs insights data to rank fairly
    },
    orderBy: { reach: "asc" },
  });

  if (mature.length < WORST_MIN_SAMPLE) return { worstPosts: [], recentAvgReach: null };

  const avg = mature.reduce((s, p) => s + (p.reach ?? 0), 0) / mature.length;
  const threshold = avg * WORST_FRACTION_OF_AVG;
  // Cap to roughly the bottom 20% so a few viral posts skewing the average up
  // can't cause us to flag half the grid.
  const cap = Math.min(WORST_MAX, Math.max(3, Math.ceil(mature.length * 0.2)));
  const flagged = mature.filter((p) => (p.reach ?? 0) < threshold).slice(0, cap);

  const worstPosts: WorstPost[] = await Promise.all(
    flagged.map(async (p) => ({
      igMediaId: p.igMediaId,
      format: p.format || p.kind,
      postedAt: p.postedAt,
      reach: p.reach ?? 0,
      likes: p.likes ?? 0,
      engagement: eng(p),
      pctOfAvg: avg > 0 ? Math.round(((p.reach ?? 0) / avg) * 100) : 0,
      permalink: await getMediaPermalink(p.igMediaId),
      articleSlug: p.articleSlug,
      theme: p.theme,
    }))
  );

  return { worstPosts, recentAvgReach: Math.round(avg) };
}

export async function buildWeeklyReport(): Promise<WeeklyReport> {
  const since = new Date(Date.now() - 7 * 86400_000);

  const [snapshots, posts, worst] = await Promise.all([
    prisma.accountSnapshot.findMany({ orderBy: { day: "asc" }, take: 60 }),
    prisma.socialPost.findMany({ where: { postedAt: { gte: since } }, orderBy: { postedAt: "desc" } }),
    computeWorstPosts(),
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
  if (worst.worstPosts.length)
    recs.push(
      `${worst.worstPosts.length} post(s) are pulling below ${Math.round(WORST_FRACTION_OF_AVG * 100)}% of your average reach (~${worst.recentAvgReach} views). Consider archiving them in-app (they're listed with links) to keep the grid strong — Instagram has no archive API, so it's a 1-tap manual step.`
    );
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
    worstPosts: worst.worstPosts,
    recentAvgReach: worst.recentAvgReach,
    recommendations: recs,
  };
}
