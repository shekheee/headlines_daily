// Prints the weekly Instagram growth report (also viewable at /admin/social).
//   npx tsx scripts/social-report.ts
import "dotenv/config";
import { buildWeeklyReport } from "@/lib/social/report";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const r = await buildWeeklyReport();
  console.log("\n===== Instagram Weekly Report =====");
  console.log(`Followers: ${r.followers ?? "—"}  (7d change: ${r.followersDelta7d ?? "—"})`);
  console.log(`Posts (7d): ${r.postsLast7d}`);
  if (r.bestSlotHourUtc != null) console.log(`Best slot (UTC hour): ${r.bestSlotHourUtc}`);
  console.log("\nBy format:");
  r.byFormat.forEach((f) => console.log(`  ${f.format.padEnd(16)} avg ${String(f.avgEngagement).padStart(6)}  (${f.posts})`));
  console.log("\nTop posts:");
  r.topPosts.forEach((p) => console.log(`  ${p.format.padEnd(14)} eng ${String(p.engagement).padStart(4)}  ${p.articleSlug ?? p.theme ?? ""}`));
  if (r.worstPosts.length) {
    console.log(`\nWorst performers — consider archiving in-app (avg reach ~${r.recentAvgReach}):`);
    r.worstPosts.forEach((p) =>
      console.log(`  ${p.format.padEnd(14)} ${String(p.reach).padStart(6)} views (${p.pctOfAvg}% of avg)  ${p.permalink ?? p.articleSlug ?? p.theme ?? ""}`)
    );
  }
  console.log("\nRecommendations:");
  r.recommendations.forEach((rec) => console.log(`  -> ${rec}`));
  console.log("===================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[report] FAILED:", e);
    process.exit(1);
  });
