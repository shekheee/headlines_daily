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

    return { posted: true, id: pubData.id };
  } catch (e) {
    return { posted: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}

/** Publish a multi-image carousel (2–10 images). Falls back to a single post if only one image. */
export async function postCarouselToInstagram(input: {
  imageUrls: string[];
  caption: string;
}): Promise<IgPostResult> {
  if (!isInstagramConfigured()) {
    return { posted: false, skipped: "Instagram not configured (IG_USER_ID / IG_ACCESS_TOKEN missing)" };
  }
  const urls = input.imageUrls.filter(Boolean).slice(0, 10);
  if (urls.length === 0) return { posted: false, skipped: "No images to post" };
  if (urls.length === 1) return postToInstagram({ imageUrl: urls[0], caption: input.caption });

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
    return { posted: true, id: pub.data.id };
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
