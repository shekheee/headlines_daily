// Insights learning loop: refresh likes/reach/saves/shares for recent Instagram
// posts and print which formats/themes perform best, so the generator can lean
// into winners.
//   npx tsx scripts/social-insights.ts
import "dotenv/config";
import { refreshInsightsAndSummarize } from "@/lib/social/generate-social";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const { updated, summary } = await refreshInsightsAndSummarize(14);
  console.log(`[insights] refreshed ${updated} post(s). Avg engagement by format (last 14d):`);
  const ranked = Object.entries(summary).sort((a, b) => b[1].avgEngagement - a[1].avgEngagement);
  for (const [format, s] of ranked) {
    console.log(`  ${format.padEnd(16)} avg ${s.avgEngagement.toString().padStart(6)}  (${s.posts} posts)`);
  }
  if (ranked.length) console.log(`\n[insights] top format right now: ${ranked[0][0]}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[insights] FAILED:", e);
    process.exit(1);
  });
