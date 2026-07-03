// Themed Instagram post generator — run on a schedule (daily) or manually:
//   npx tsx scripts/social-post.ts
//   SOCIAL_DRY_RUN=1 npx tsx scripts/social-post.ts   # build slides but don't post
//
// Picks today's theme from lib/social/themes.ts, generates copy + AI images with
// hook overlays, and posts a single image or carousel to Instagram.
import "dotenv/config";
import { generateSocialPost } from "@/lib/social/generate-social";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const dryRun = process.env.SOCIAL_DRY_RUN === "1";
  const result = await generateSocialPost(new Date(), { dryRun });

  console.log(`[social] theme: ${result.theme} (${result.style}) — ${result.slides} slide(s) in ${result.tookMs}ms`);
  result.slideUrls.forEach((u, i) => console.log(`  slide ${i + 1}: ${u}`));
  console.log(`[social] caption:\n${result.caption}`);
  if (result.errors.length) console.log("[social] errors:", result.errors);
  console.log("[social] instagram:", JSON.stringify(result.instagram));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[social] FAILED:", e);
    process.exit(1);
  });
