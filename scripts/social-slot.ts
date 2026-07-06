// Posts ONE Instagram item — used by the scheduler to spread posts across IST
// peak times. The post type is chosen by SOCIAL_ACTION, else by the UTC hour.
//   SOCIAL_ACTION=theme|reel|article|story npx tsx scripts/social-slot.ts
//   SOCIAL_DRY_RUN=1 npx tsx scripts/social-slot.ts
import "dotenv/config";
import { runReelBatch, runSocialSlot } from "@/lib/social/generate-social";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  const dryRun = process.env.SOCIAL_DRY_RUN === "1";
  const action = process.env.SOCIAL_ACTION;

  // Batch: 1 history + 2 recent (incl. Indian politics) narrated reels.
  if (action === "reels3") {
    const b = await runReelBatch(new Date(), { dryRun });
    for (const p of b.posts) {
      console.log(`[reels3] ${p.ok ? "✓" : "✗"} ${p.label} (${p.kind}/${p.format}) ${JSON.stringify(p.instagram).slice(0, 160)}`);
      if (p.errors.length) console.log("  errors:", p.errors.join("; "));
    }
    console.log(`[reels3] posted ${b.posted}/${b.requested} in ${b.tookMs}ms`);
    return;
  }

  const r = await runSocialSlot(action, new Date(), { dryRun });
  console.log(`[social-slot] ${r.ok ? "✓" : "✗"} ${r.label} (${r.kind}/${r.format}) ${JSON.stringify(r.instagram).slice(0, 160)}`);
  if (r.errors.length) console.log("  errors:", r.errors.join("; "));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[social-slot] FAILED:", e);
    process.exit(1);
  });
