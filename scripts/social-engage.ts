// Auto-reply to comments on our recent Instagram posts (safe, official API only).
//   SOCIAL_DRY_RUN=1 npx tsx scripts/social-engage.ts
import "dotenv/config";
import { engageRecentComments } from "@/lib/social/engage";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const dryRun = process.env.SOCIAL_DRY_RUN === "1";
  const r = await engageRecentComments({ withinDays: 3, maxPerPost: 8, dryRun });
  console.log(`[engage] posts=${r.postsChecked} comments=${r.commentsSeen} replied=${r.replied}${dryRun ? " (dry run)" : ""}`);
  if (r.errors.length) console.log("  errors:", r.errors.slice(0, 5).join("; "));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[engage] FAILED:", e);
    process.exit(1);
  });
