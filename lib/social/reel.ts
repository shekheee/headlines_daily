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

/** Cloudinary delivery URL that turns `publicId` into a 9:16 zooming MP4 with text.
 *  Text is kept inside Instagram's Reel "safe zone": away from the top ~130px and
 *  the bottom ~430px (where IG overlays the caption, handle and action buttons),
 *  and with side margins, so nothing gets clipped or hidden by the UI. */
export function reelVideoUrl(publicId: string, opts: ReelOptions): string {
  const accent = opts.accent || "F5C518";
  const du = Math.min(Math.max(opts.durationSec ?? 6, 4), 10);
  const t: string[] = [];

  // NOTE: g_auto is NOT supported with zoompan video generation (Cloudinary 500s),
  // so use a plain center fill.
  t.push("c_fill,w_1080,h_1920");
  t.push(`e_zoompan:mode_ofl;maxzoom_1.3;du_${du}`);
  t.push("e_brightness:-26");

  // All text is bottom-anchored (grows upward) so it never clips off the bottom,
  // and sits above IG's bottom UI band (~430px). Side margin 90px, width 900px.
  const subY = 470;
  const hookY = opts.sub ? subY + 150 : subY;
  const kickerY = hookY + 320; // above the hook block (hook wraps upward)

  if (opts.kicker) {
    t.push(`co_rgb:${accent},l_text:${FONT}_46_bold_letter_spacing_2:${encodeText(opts.kicker.toUpperCase())},g_south_west,x_90,y_${kickerY}`);
  }
  t.push(`co_white,l_text:${FONT}_80_bold_line_spacing_-6:${encodeText(opts.hook)},w_900,c_fit,g_south_west,x_90,y_${hookY}`);
  if (opts.sub) {
    t.push(`co_rgb:e8e8e8,l_text:${FONT}_44:${encodeText(opts.sub)},w_900,c_fit,g_south_west,x_90,y_${subY}`);
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
