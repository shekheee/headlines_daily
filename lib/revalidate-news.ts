import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateNews(slugs: string[] = []) {
  // Keep archive bodies warm: only edited/deleted article URLs are expired.
  revalidateTag("articles", { expire: 0 });
  for (const path of ["/", "/link", "/sitemap.xml", "/news-sitemap.xml", "/feed.xml"]) {
    revalidatePath(path);
  }
  for (const slug of slugs) revalidatePath(`/articles/${slug}`);
}
