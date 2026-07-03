// Instagram auto-posting via the Instagram Content Publishing API.
//
// Requires (set as env vars when ready):
//   IG_USER_ID       - the Instagram Business/Creator account ID
//   IG_ACCESS_TOKEN  - a long-lived token with content-publish permission
//   IG_GRAPH_BASE    - (optional) API host. Two valid setups:
//       * "API setup with Instagram login" (no Facebook Page needed):
//           set IG_GRAPH_BASE=https://graph.instagram.com
//       * "API setup with Facebook login" (IG linked to a Facebook Page):
//           leave unset -> defaults to https://graph.facebook.com/v21.0
//
// Until IG_USER_ID + IG_ACCESS_TOKEN are set, postToInstagram() is a safe no-op
// so the daily job never fails.

const GRAPH = process.env.IG_GRAPH_BASE || "https://graph.facebook.com/v21.0";

export interface IgPostResult {
  posted: boolean;
  id?: string;
  skipped?: string;
  error?: string;
}

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Post the hashtags/extra text as the FIRST COMMENT (keeps captions clean, still discoverable). */
export async function postComment(mediaId: string, message: string): Promise<boolean> {
  if (!isInstagramConfigured() || !message.trim()) return false;
  const token = process.env.IG_ACCESS_TOKEN!;
  try {
    const res = await fetch(`${GRAPH}/${mediaId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.slice(0, 2200), access_token: token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Poll a media container until Instagram finishes fetching/processing the image. */
async function waitForContainerReady(containerId: string, token: string, tries = 8): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    await sleep(2500);
    try {
      const res = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${token}`);
      const data = await res.json();
      if (data.status_code === "FINISHED") return true;
      if (data.status_code === "ERROR" || data.status_code === "EXPIRED") return false;
    } catch {
      // keep polling
    }
  }
  return true; // fall through and attempt publish anyway
}

export async function postToInstagram(input: {
  imageUrl: string;
  caption: string;
  firstComment?: string;
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

    // Wait for Instagram to fetch + process the image before publishing.
    await waitForContainerReady(createData.id, token);

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

    if (input.firstComment) await postComment(pubData.id, input.firstComment);
    return { posted: true, id: pubData.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

/** Publish a multi-image carousel (2–10 images). Falls back to a single post if only one image. */
export async function postCarouselToInstagram(input: {
  imageUrls: string[];
  caption: string;
  firstComment?: string;
}): Promise<IgPostResult> {
  if (!isInstagramConfigured()) {
    return { posted: false, skipped: "Instagram not configured (IG_USER_ID / IG_ACCESS_TOKEN missing)" };
  }
  const urls = input.imageUrls.filter(Boolean).slice(0, 10);
  if (urls.length === 0) return { posted: false, skipped: "No images to post" };
  if (urls.length === 1) return postToInstagram({ imageUrl: urls[0], caption: input.caption, firstComment: input.firstComment });

  const userId = process.env.IG_USER_ID!;
  const token = process.env.IG_ACCESS_TOKEN!;

  const post = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(`${GRAPH}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, access_token: token }),
    });
    return { res, data: await res.json() };
  };

  try {
    // 1) One child container per image.
    const childIds: string[] = [];
    for (const url of urls) {
      const { res, data } = await post(`${userId}/media`, { image_url: url, is_carousel_item: true });
      if (!res.ok || !data.id) return { posted: false, error: `child: ${JSON.stringify(data).slice(0, 200)}` };
      childIds.push(data.id);
    }
    // 2) Parent carousel container.
    const parent = await post(`${userId}/media`, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: input.caption.slice(0, 2200),
    });
    if (!parent.res.ok || !parent.data.id) {
      return { posted: false, error: `parent: ${JSON.stringify(parent.data).slice(0, 200)}` };
    }
    await waitForContainerReady(parent.data.id, token);
    // 3) Publish.
    const pub = await post(`${userId}/media_publish`, { creation_id: parent.data.id });
    if (!pub.res.ok || !pub.data.id) {
      return { posted: false, error: `publish: ${JSON.stringify(pub.data).slice(0, 200)}` };
    }
    if (input.firstComment) await postComment(pub.data.id, input.firstComment);
    return { posted: true, id: pub.data.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

/** Publish a Reel (9:16 MP4). Video processing takes longer, so we poll more. */
export async function postReel(input: { videoUrl: string; caption: string; firstComment?: string }): Promise<IgPostResult> {
  if (!isInstagramConfigured()) {
    return { posted: false, skipped: "Instagram not configured" };
  }
  if (!input.videoUrl) return { posted: false, skipped: "No video to post" };
  const userId = process.env.IG_USER_ID!;
  const token = process.env.IG_ACCESS_TOKEN!;
  try {
    const createRes = await fetch(`${GRAPH}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "REELS", video_url: input.videoUrl, caption: input.caption.slice(0, 2200), access_token: token }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      return { posted: false, error: `reel container: ${JSON.stringify(createData).slice(0, 200)}` };
    }
    // Video needs longer to transcode.
    const ready = await waitForContainerReady(createData.id, token, 20);
    if (!ready) return { posted: false, error: "reel container not ready (transcode failed)" };
    const pubRes = await fetch(`${GRAPH}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    });
    const pubData = await pubRes.json();
    if (!pubRes.ok || !pubData.id) return { posted: false, error: `reel publish: ${JSON.stringify(pubData).slice(0, 200)}` };
    if (input.firstComment) await postComment(pubData.id, input.firstComment);
    return { posted: true, id: pubData.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

/** Publish an image Story. NOTE: the Content Publishing API does NOT support poll/link
 *  stickers on Stories, so this is a plain image Story (great for a daily teaser). */
export async function postStory(input: { imageUrl: string }): Promise<IgPostResult> {
  if (!isInstagramConfigured()) return { posted: false, skipped: "Instagram not configured" };
  if (!input.imageUrl) return { posted: false, skipped: "No image to post" };
  const userId = process.env.IG_USER_ID!;
  const token = process.env.IG_ACCESS_TOKEN!;
  try {
    const createRes = await fetch(`${GRAPH}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "STORIES", image_url: input.imageUrl, access_token: token }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) return { posted: false, error: `story container: ${JSON.stringify(createData).slice(0, 200)}` };
    await waitForContainerReady(createData.id, token);
    const pubRes = await fetch(`${GRAPH}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    });
    const pubData = await pubRes.json();
    if (!pubRes.ok || !pubData.id) return { posted: false, error: `story publish: ${JSON.stringify(pubData).slice(0, 200)}` };
    return { posted: true, id: pubData.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

export interface AccountStats {
  followers: number;
  follows: number;
  mediaCount: number;
}

/** The account's current username (so username changes don't break anything). */
export async function getAccountUsername(): Promise<string | null> {
  if (!isInstagramConfigured()) return null;
  const token = process.env.IG_ACCESS_TOKEN!;
  const userId = process.env.IG_USER_ID!;
  try {
    const res = await fetch(`${GRAPH}/${userId}?fields=username&access_token=${token}`);
    const data = await res.json();
    return res.ok && data.username ? String(data.username) : null;
  } catch {
    return null;
  }
}

/** Current account totals (followers / following / media count). */
export async function getAccountStats(): Promise<AccountStats | null> {
  if (!isInstagramConfigured()) return null;
  const token = process.env.IG_ACCESS_TOKEN!;
  const userId = process.env.IG_USER_ID!;
  try {
    const res = await fetch(`${GRAPH}/${userId}?fields=followers_count,follows_count,media_count&access_token=${token}`);
    const data = await res.json();
    if (!res.ok) return null;
    return {
      followers: Number(data.followers_count) || 0,
      follows: Number(data.follows_count) || 0,
      mediaCount: Number(data.media_count) || 0,
    };
  } catch {
    return null;
  }
}

export interface MediaInsights {
  likes?: number;
  reach?: number;
  saved?: number;
  comments?: number;
  shares?: number;
}

/** Fetch engagement insights for a published media item. */
export async function getMediaInsights(mediaId: string): Promise<MediaInsights | null> {
  if (!isInstagramConfigured()) return null;
  const token = process.env.IG_ACCESS_TOKEN!;
  const out: MediaInsights = {};
  // likes/comments come from the media node; reach/saved/shares from insights.
  try {
    const fieldsRes = await fetch(`${GRAPH}/${mediaId}?fields=like_count,comments_count&access_token=${token}`);
    const fields = await fieldsRes.json();
    if (typeof fields.like_count === "number") out.likes = fields.like_count;
    if (typeof fields.comments_count === "number") out.comments = fields.comments_count;
  } catch {
    /* ignore */
  }
  try {
    const insRes = await fetch(`${GRAPH}/${mediaId}/insights?metric=reach,saved,shares&access_token=${token}`);
    const ins = await insRes.json();
    if (Array.isArray(ins.data)) {
      for (const m of ins.data) {
        const val = m?.values?.[0]?.value;
        if (typeof val === "number") (out as Record<string, number>)[m.name] = val;
      }
    }
  } catch {
    /* ignore */
  }
  return Object.keys(out).length ? out : null;
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
