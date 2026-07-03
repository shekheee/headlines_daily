// Themed Instagram batch generator — run daily or manually:
//   npx tsx scripts/social-post.ts
//   SOCIAL_POST_COUNT=5 npx tsx scripts/social-post.ts
//   SOCIAL_DRY_RUN=1 npx tsx scripts/social-post.ts   # build slides but don't post
//
// Posts a full day's batch: the day's calendar theme + top-story posts, each
// with hook overlays and a 2-week rotating look.
import "dotenv/config";
import { generateDailySocialPosts } from "@/lib/social/generate-social";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const dryRun = process.env.SOCIAL_DRY_RUN === "1";
  const count = Math.max(1, parseInt(process.env.SOCIAL_POST_COUNT || "5"));
  const result = await generateDailySocialPosts(new Date(), { count, dryRun });

  console.log(`[social] ${result.date} — style "${result.stylePack}" — posted ${result.posted}/${result.requested} in ${result.tookMs}ms`);
  for (const p of result.posts) {
    console.log(`  ${p.ok ? "✓" : "✗"} ${p.label} (${p.kind}/${p.format}, ${p.slides} slide${p.slides === 1 ? "" : "s"}) ${JSON.stringify(p.instagram).slice(0, 120)}`);
    if (p.errors.length) console.log(`     errors: ${p.errors.join("; ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[social] FAILED:", e);
    process.exit(1);
  });
