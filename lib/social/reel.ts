// Builds a 9:16 Instagram Reel (MP4) from a still image using Cloudinary's
// server-side `e_zoompan` Ken-Burns effect + text overlays — no ffmpeg needed.
// Reels get far more reach than static posts, so this is our top like-driver.
import { encodeText } from "@/lib/social/overlay";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || "";
const FONT = "Arial";

export interface ReelOptions {
  kicker?: string;
  hook: string;
  sub?: string;
  brand?: string;
  accent?: string;
  durationSec?: number;
}

/** Cloudinary delivery URL that turns `publicId` into a 9:16 zooming MP4 with text. */
export function reelVideoUrl(publicId: string, opts: ReelOptions): string {
  const accent = opts.accent || "F5C518";
  const du = Math.min(Math.max(opts.durationSec ?? 6, 4), 10);
  const t: string[] = [];

  t.push("c_fill,g_auto,w_1080,h_1920");
  t.push(`e_zoompan:mode_ofl;maxzoom_1.3;du_${du}`);
  t.push("e_brightness:-24");

  if (opts.kicker) {
    t.push(`co_rgb:${accent},l_text:${FONT}_52_bold_letter_spacing_2:${encodeText(opts.kicker.toUpperCase())},g_north_west,x_80,y_240`);
  }
  t.push(`co_white,l_text:${FONT}_104_bold_line_spacing_-8:${encodeText(opts.hook)},w_920,c_fit,g_west,x_80,y_-40`);
  if (opts.sub) {
    t.push(`co_rgb:e8e8e8,l_text:${FONT}_48:${encodeText(opts.sub)},w_920,c_fit,g_west,x_80,y_220`);
  }
  if (opts.brand) {
    t.push(`co_rgb:ffffff,l_text:${FONT}_40_bold:${encodeText(opts.brand)},g_south,y_200`);
  }
  t.push("f_mp4,q_auto");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${publicId}`;
}

/** Pre-generate + cache the derived video so Instagram's fetch doesn't time out. */
export async function primeReel(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok && (res.headers.get("content-type") || "").includes("video");
  } catch {
    return false;
  }
}
