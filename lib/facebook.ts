// Optional cross-posting to a Facebook Page (more reach surfaces = more likes).
// Requires a Facebook Page linked to a Meta app with a Page access token:
//   FB_PAGE_ID            - the Facebook Page ID
//   FB_PAGE_ACCESS_TOKEN  - a long-lived Page token with pages_manage_posts
// If unset, every function is a safe no-op so the pipeline never fails.
const FB_GRAPH = process.env.FB_GRAPH_BASE || "https://graph.facebook.com/v21.0";

export interface FbResult {
  posted: boolean;
  id?: string;
  skipped?: string;
  error?: string;
}

export function isFacebookConfigured(): boolean {
  return Boolean(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN);
}

/** Post a photo (with caption) to the Facebook Page feed. */
export async function postToFacebookPage(input: { imageUrl: string; caption: string }): Promise<FbResult> {
  if (!isFacebookConfigured()) return { posted: false, skipped: "Facebook not configured" };
  if (!input.imageUrl) return { posted: false, skipped: "No image" };
  const pageId = process.env.FB_PAGE_ID!;
  const token = process.env.FB_PAGE_ACCESS_TOKEN!;
  try {
    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.imageUrl, caption: input.caption.slice(0, 5000), access_token: token }),
    });
    const data = await res.json();
    if (!res.ok || !(data.id || data.post_id)) {
      return { posted: false, error: `fb photo: ${JSON.stringify(data).slice(0, 200)}` };
    }
    return { posted: true, id: data.post_id || data.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}
