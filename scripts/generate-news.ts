// Standalone daily news generator — run on a schedule (Render Cron Job):
//   npx tsx scripts/generate-news.ts
//
// Reads config from the environment (DATABASE_URL, GEMINI_API_KEY, optional
// GEMINI_MODEL, NEXT_PUBLIC_APP_URL, IG_USER_ID, IG_ACCESS_TOKEN, GENERATE_LIMIT).
import "dotenv/config";
import { DEFAULT_MAX_PER_RUN, generateDailyNews } from "@/lib/generate-news";
import { exitForError } from "@/lib/db-quota";
import { appendFileSync } from "node:fs";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const max = Math.max(1, parseInt(process.env.GENERATE_LIMIT || String(DEFAULT_MAX_PER_RUN)));
  console.log(`[generate-news] starting run, up to ${max} articles…`);
  const result = await generateDailyNews(max);
  console.log(`[generate-news] created ${result.created} article(s) in ${result.tookMs}ms`);
  for (const a of result.articles) console.log(`  - [${a.category}] ${a.title}`);
  if (result.errors.length) console.log("[generate-news] errors:", result.errors);
  console.log("[generate-news] instagram:", JSON.stringify(result.instagram));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT,
      `created=${result.created}\nrefresh_body=${JSON.stringify({ slugs: result.articles.map((a) => a.slug) })}\n`);
  }
  if (!result.created && result.errors.length) {
    throw new Error("No articles were generated; cache refresh skipped. See generation errors above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => exitForError("generate-news", e));
