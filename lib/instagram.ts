// Instagram auto-posting via the Instagram Graph API.
//
// Requires (set as env vars when ready):
//   IG_USER_ID       - the Instagram Business/Creator account ID (an IG account
//                      linked to a Facebook Page)
//   IG_ACCESS_TOKEN  - a long-lived access token with instagram_content_publish
//
// Until those are set, postToInstagram() is a safe no-op so the daily job never fails.

const GRAPH = "https://graph.facebook.com/v21.0";

export interface IgPostResult {
  posted: boolean;
  id?: string;
  skipped?: string;
  error?: string;
}

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

export async function postToInstagram(input: {
  imageUrl: string;
  caption: string;
}): Promise<IgPostResult> {
  if (!isInstagramConfigured()) {
    return { posted: false, skipped: "Instagram not configured (IG_USER_ID / IG_ACCESS_TOKEN missing)" };
  }
  if (!input.imageUrl) {
    return { posted: false, skipped: "No image available to post" };
  }

  const userId = process.env.IG_USER_ID!;
  const token = process.env.IG_ACCESS_TOKEN!;

  try {
    // 1) Create a media container.
    const createRes = await fetch(`${GRAPH}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: input.imageUrl,
        caption: input.caption.slice(0, 2200),
        access_token: token,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      return { posted: false, error: `container: ${JSON.stringify(createData).slice(0, 200)}` };
    }

    // 2) Publish the container.
    const pubRes = await fetch(`${GRAPH}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    });
    const pubData = await pubRes.json();
    if (!pubRes.ok || !pubData.id) {
      return { posted: false, error: `publish: ${JSON.stringify(pubData).slice(0, 200)}` };
    }

    return { posted: true, id: pubData.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

export function buildCaption(a: {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
}): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const link = base ? `${base}/articles/${a.slug}` : "";
  const tags = ["#news", "#dailynews", `#${a.category.replace(/[^a-z0-9]/gi, "").toLowerCase()}`, "#breakingnews"];
  return [
    a.title,
    "",
    a.excerpt,
    "",
    link ? `Read more: ${link}` : "",
    "",
    tags.join(" "),
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();
}
