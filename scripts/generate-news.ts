// Standalone daily news generator — run on a schedule (Render Cron Job):
//   npx tsx scripts/generate-news.ts
//
// Reads config from the environment (DATABASE_URL, GEMINI_API_KEY, optional
// GEMINI_MODEL, NEXT_PUBLIC_APP_URL, IG_USER_ID, IG_ACCESS_TOKEN, GENERATE_LIMIT).
import "dotenv/config";
import { DEFAULT_MAX_PER_RUN, generateDailyNews } from "@/lib/generate-news";

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
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[generate-news] FAILED:", e);
    process.exit(1);
  });
