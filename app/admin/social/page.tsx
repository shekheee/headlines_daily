import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { buildWeeklyReport } from "@/lib/social/report";
import { formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram — Headlines Daily Admin" };

function istLabel(utcHour: number): string {
  const ist = (utcHour + 5.5) % 24;
  const h = Math.floor(ist);
  const m = ist % 1 ? "30" : "00";
  return `${String(h).padStart(2, "0")}:${m} IST`;
}

export default async function SocialReportPage() {
  const r = await buildWeeklyReport();

  const maxFollowers = Math.max(1, ...r.followerSeries.map((s) => s.followers));
  const delta = r.followersDelta7d;
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor = delta == null || delta === 0 ? "text-muted-foreground" : delta > 0 ? "text-green-600" : "text-red-600";
  const maxFmt = Math.max(1, ...r.byFormat.map((f) => f.avgEngagement));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="h-7 w-7 text-pink-600" />
        <div>
          <h1 className="text-3xl font-bold">Instagram Growth</h1>
          <p className="text-muted-foreground mt-1 text-sm">Weekly report · {r.postsLast7d} posts in the last 7 days</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Followers</div>
            <div className="text-3xl font-bold">{r.followers ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Change (7d)</div>
            <div className={`text-3xl font-bold flex items-center gap-1 ${deltaColor}`}>
              <DeltaIcon className="h-6 w-6" />
              {delta == null ? "—" : delta > 0 ? `+${delta}` : delta}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Posts (7d)</div>
            <div className="text-3xl font-bold">{r.postsLast7d}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Best time</div>
            <div className="text-xl font-bold">{r.bestSlotHourUtc == null ? "—" : istLabel(r.bestSlotHourUtc)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Follower trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Follower trend</CardTitle>
        </CardHeader>
        <CardContent>
          {r.followerSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snapshots yet — the nightly job records one per day. Check back tomorrow.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {r.followerSeries.map((s) => (
                <div key={s.day} className="flex-1 flex flex-col items-center justify-end group" title={`${s.day}: ${s.followers}`}>
                  <div className="w-full bg-pink-500/80 rounded-t hover:bg-pink-500 transition-colors" style={{ height: `${Math.max(4, (s.followers / maxFollowers) * 100)}%` }} />
                  <span className="text-[9px] text-muted-foreground mt-1 rotate-0">{s.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top posts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top posts (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            {r.topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {r.topPosts.map((p) => (
                  <div key={p.igMediaId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{p.format}</Badge>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(p.postedAt)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.articleSlug ?? p.theme ?? "—"}</div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="font-semibold text-sm">{p.engagement}</div>
                      <div className="text-[10px] text-muted-foreground">♥ {p.likes} · 🔖 {p.saved} · 💬 {p.comments}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Format performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">By format</CardTitle>
          </CardHeader>
          <CardContent>
            {r.byFormat.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {r.byFormat.map((f) => (
                  <div key={f.format}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{f.format}</span>
                      <span className="text-muted-foreground">avg {f.avgEngagement} · {f.posts} posts</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-blue-500 rounded" style={{ width: `${(f.avgEngagement / maxFmt) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">What to do next</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {r.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-blue-600 font-bold">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
