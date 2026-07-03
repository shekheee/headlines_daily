// Builds and publishes a themed Instagram post/carousel for a given date,
// driven entirely by the saved templates in ./themes.ts.
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { geminiJson } from "@/lib/gemini";
import { generateAndHostImage } from "@/lib/gemini-image";
import { postCarouselToInstagram, postToInstagram } from "@/lib/instagram";
import { fullHashtags, getThemeForDate, type Theme } from "@/lib/social/themes";
import { overlayUrl, publicIdFromUrl } from "@/lib/social/overlay";

const BRAND = process.env.IG_BRAND_HANDLE || "@yournishsuri";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export interface SocialResult {
  ok: boolean;
  theme: string;
  style: string;
  slides: number;
  slideUrls: string[];
  caption: string;
  instagram: unknown;
  errors: string[];
  tookMs: number;
}

interface Article {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  categoryName: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function trimWords(text: string, max: number): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  return words.length <= max ? words.join(" ") : words.slice(0, max).join(" ") + "…";
}

async function fetchArticles(theme: Theme, limit: number, ignoreCategory = false): Promise<Article[]> {
  const since = new Date(Date.now() - theme.withinDays * 86400_000);
  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: since },
      ...(ignoreCategory || !theme.categorySlugs?.length
        ? {}
        : { category: { slug: { in: theme.categorySlugs } } }),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      featuredImage: true,
      category: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    featuredImage: r.featuredImage,
    categoryName: r.category?.name ?? "News",
  }));
}

/** Resolve any image URL to a Cloudinary public_id (uploading remote images if needed). */
async function toPublicId(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.includes("res.cloudinary.com")) return publicIdFromUrl(imageUrl);
  try {
    const up = await uploadImage(imageUrl, "daily-news/social");
    return up.publicId;
  } catch {
    return null;
  }
}

async function coverPublicId(theme: Theme, topic?: string, errors?: string[]): Promise<string | null> {
  const prompt = topic ? `${theme.imagePrompt} The story is about: ${topic}.` : theme.imagePrompt;
  const img = await generateAndHostImage(prompt, "4:5");
  if (img) return img.publicId;
  errors?.push("cover image generation failed");
  return null;
}

function buildCaption(theme: Theme, body: string, link?: string): string {
  return [body.trim(), "", link ? `Read more: ${link}` : APP_URL ? `More at ${APP_URL}` : "", "", fullHashtags(theme)]
    .filter((l) => l !== "")
    .join("\n")
    .slice(0, 2200);
}

// ---------------------------------------------------------------------------

export async function generateSocialPost(
  date = new Date(),
  opts: { dryRun?: boolean } = {}
): Promise<SocialResult> {
  const started = Date.now();
  const theme = getThemeForDate(date);
  const errors: string[] = [];
  let slideUrls: string[] = [];
  let caption = "";

  try {
    if (theme.style === "motivation") {
      const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
        `${theme.copyPrompt}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`
      );
      const pid = await coverPublicId(theme, undefined, errors);
      if (pid && copy) {
        slideUrls = [
          overlayUrl(pid, { kicker: theme.kicker, hook: copy.hook, sub: copy.sub, brand: BRAND, accent: theme.accent }),
        ];
        caption = buildCaption(theme, copy.caption);
      }
    } else if (theme.style === "article-single") {
      let arts = await fetchArticles(theme, 1);
      if (!arts.length) arts = await fetchArticles(theme, 1, true);
      const a = arts[0];
      if (a) {
        const copy = await geminiJson<{ hook: string; sub: string; caption: string }>(
          `${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nSUMMARY: ${a.excerpt || stripHtml(a.content).slice(0, 400)}\n\nReturn ONLY JSON: {"hook": string, "sub": string, "caption": string}`
        );
        const pid = (await toPublicId(a.featuredImage)) || (await coverPublicId(theme, a.title, errors));
        if (pid && copy) {
          slideUrls = [
            overlayUrl(pid, { kicker: theme.kicker, hook: copy.hook, sub: copy.sub, brand: BRAND, accent: theme.accent }),
          ];
          caption = buildCaption(theme, copy.caption, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
        }
      } else {
        errors.push("no articles available for article-single theme");
      }
    } else if (theme.style === "headlines") {
      let arts = await fetchArticles(theme, theme.slides - 1);
      if (arts.length < 2) arts = await fetchArticles(theme, theme.slides - 1, true);
      if (arts.length >= 2) {
        const copy = await geminiJson<{ coverHook: string; caption: string }>(
          `${theme.copyPrompt}\n\nHEADLINES:\n${arts.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}\n\nReturn ONLY JSON: {"coverHook": string, "caption": string}`
        );
        const coverPid = await coverPublicId(theme, undefined, errors);
        const slides: string[] = [];
        if (coverPid && copy) {
          slides.push(
            overlayUrl(coverPid, {
              kicker: theme.kicker,
              hook: copy.coverHook,
              sub: "Swipe →",
              brand: BRAND,
              accent: theme.accent,
            })
          );
        }
        for (const a of arts) {
          const pid = await toPublicId(a.featuredImage);
          if (!pid) continue;
          slides.push(
            overlayUrl(pid, {
              kicker: a.categoryName,
              hook: trimWords(a.title, 12),
              brand: BRAND,
              accent: theme.accent,
            })
          );
        }
        slideUrls = slides;
        caption = buildCaption(theme, copy?.caption || `${theme.name}: the stories that mattered.`);
      } else {
        errors.push("not enough articles for headlines carousel");
      }
    } else if (theme.style === "explainer") {
      let arts = await fetchArticles(theme, 1);
      if (!arts.length) arts = await fetchArticles(theme, 1, true);
      const a = arts[0];
      if (a) {
        const copy = await geminiJson<{ coverHook: string; keyPoints: string[]; caption: string }>(
          `${theme.copyPrompt}\n\nARTICLE TITLE: ${a.title}\nBODY: ${stripHtml(a.content).slice(0, 1200)}\n\nReturn ONLY JSON: {"coverHook": string, "keyPoints": string[], "caption": string}`
        );
        const slides: string[] = [];
        const coverPid = (await coverPublicId(theme, a.title, errors)) || (await toPublicId(a.featuredImage));
        if (coverPid && copy) {
          slides.push(
            overlayUrl(coverPid, {
              kicker: theme.kicker,
              hook: copy.coverHook,
              sub: "Swipe →",
              brand: BRAND,
              accent: theme.accent,
            })
          );
        }
        const points = (copy?.keyPoints || []).slice(0, theme.slides - 1);
        for (let i = 0; i < points.length; i++) {
          const bg = await generateAndHostImage(`${theme.imagePrompt} The story is about: ${a.title}.`, "4:5");
          const pid = bg?.publicId || coverPid;
          if (!pid) continue;
          slides.push(
            overlayUrl(pid, {
              kicker: `${i + 1} / ${points.length}`,
              hook: points[i],
              brand: BRAND,
              accent: theme.accent,
            })
          );
        }
        slideUrls = slides;
        caption = buildCaption(theme, copy?.caption || a.excerpt || a.title, APP_URL ? `${APP_URL}/articles/${a.slug}` : undefined);
      } else {
        errors.push("no article available for explainer theme");
      }
    }

    if (!slideUrls.length) {
      return { ok: false, theme: theme.name, style: theme.style, slides: 0, slideUrls, caption, instagram: { skipped: "nothing to post" }, errors, tookMs: Date.now() - started };
    }

    const instagram = opts.dryRun
      ? { skipped: "dry run — not posted" }
      : slideUrls.length === 1
        ? await postToInstagram({ imageUrl: slideUrls[0], caption })
        : await postCarouselToInstagram({ imageUrls: slideUrls, caption });

    return {
      ok: true,
      theme: theme.name,
      style: theme.style,
      slides: slideUrls.length,
      slideUrls,
      caption,
      instagram,
      errors,
      tookMs: Date.now() - started,
    };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "social generation failed");
    return { ok: false, theme: theme.name, style: theme.style, slides: slideUrls.length, slideUrls, caption, instagram: { error: true }, errors, tookMs: Date.now() - started };
  }
}
