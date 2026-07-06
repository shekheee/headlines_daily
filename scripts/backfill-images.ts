// One-off / repeatable backfill: give every published article artwork.
// For each article with no featuredImage we try an AI editorial image and, if
// that is unavailable, fall back to a branded category card so no card, list
// item, or carousel slide is ever left blank.
//   npx tsx scripts/backfill-images.ts
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateAndHostArticleImage } from "@/lib/gemini-image";
import { articlePlaceholderUrl } from "@/lib/social/overlay";
import { ensureCaptionBase } from "@/lib/social/caption-base";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const articles = await prisma.article.findMany({
    where: { OR: [{ featuredImage: null }, { featuredImage: "" }] },
    select: {
      id: true,
      title: true,
      excerpt: true,
      category: { select: { name: true, color: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  console.log(`[backfill-images] ${articles.length} article(s) missing artwork`);
  let ai = 0;
  let placeholder = 0;

  for (const a of articles) {
    const catName = a.category?.name || "News";
    let imageUrl: string | null = await generateAndHostArticleImage({
      title: a.title,
      category: catName,
      excerpt: a.excerpt || undefined,
    });
    if (imageUrl) ai++;
    else {
      try {
        const base = await ensureCaptionBase();
        imageUrl = articlePlaceholderUrl(base, {
          title: a.title,
          kicker: catName,
          color: a.category?.color ?? undefined,
        });
        placeholder++;
      } catch {
        imageUrl = null;
      }
    }
    if (!imageUrl) {
      console.log(`  ! skipped (no image): ${a.title.slice(0, 60)}`);
      continue;
    }
    await prisma.article.update({
      where: { id: a.id },
      data: { featuredImage: imageUrl, featuredImageAlt: a.title },
    });
    console.log(`  ✓ ${a.title.slice(0, 60)}`);
  }

  console.log(`[backfill-images] done — ${ai} AI image(s), ${placeholder} placeholder(s)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[backfill-images] FAILED:", e);
    process.exit(1);
  });
