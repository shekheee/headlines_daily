// Builds a 9:16 Instagram Reel (MP4) with a Ken-Burns zooming background and
// STATIC text — no ffmpeg needed.
//
// Why two steps: Cloudinary's `e_zoompan` zooms the whole layer, so text baked
// into it scales and drifts out of frame. Instead we (1) render the zooming
// background as a standalone video, then (2) overlay text on that VIDEO base —
// overlays on a video stay fixed in place while the footage zooms behind them.
import { encodeText } from "@/lib/social/overlay";
import { cloudinary } from "@/lib/cloudinary";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || "";
const FONT = "Arial";

export interface ReelOptions {
  kicker?: string;
  hook: string;
  sub?: string;
  accent?: string;
  durationSec?: number;
}

/** Step 1: a 9:16 zooming background video (no text) generated from a still. */
function zoomBackgroundUrl(publicId: string, du: number): string {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,w_1080,h_1920/e_zoompan:mode_ofl;maxzoom_1.3;du_${du}/e_brightness:-26/f_mp4/${publicId}`;
}

/** Step 2: text overlay transform, applied over a video normalized to 1080x1920.
 *  Text is bottom-anchored inside IG's safe zone so nothing clips or hides. */
function textTransform(opts: ReelOptions): string {
  const accent = opts.accent || "F5C518";
  const t: string[] = ["c_fill,w_1080,h_1920"]; // normalize base video to full res
  const subY = 470;
  const hookY = opts.sub ? subY + 150 : subY;
  const kickerY = hookY + 320;
  if (opts.kicker) {
    t.push(`co_rgb:${accent},l_text:${FONT}_46_bold_letter_spacing_2:${encodeText(opts.kicker.toUpperCase())},g_south_west,x_90,y_${kickerY}`);
  }
  t.push(`co_white,l_text:${FONT}_80_bold_line_spacing_-6:${encodeText(opts.hook)},w_900,c_fit,g_south_west,x_90,y_${hookY}`);
  if (opts.sub) {
    t.push(`co_rgb:e8e8e8,l_text:${FONT}_44:${encodeText(opts.sub)},w_900,c_fit,g_south_west,x_90,y_${subY}`);
  }
  return t.join("/");
}

/** Build the final Reel MP4 URL (uploads the zoom background, then overlays text). */
export async function buildReelVideo(publicId: string, opts: ReelOptions): Promise<string | null> {
  const du = Math.min(Math.max(opts.durationSec ?? 6, 4), 10);
  const bg = zoomBackgroundUrl(publicId, du);
  try {
    const up = await cloudinary.uploader.upload(bg, { resource_type: "video", folder: "daily-news/reels" });
    return `https://res.cloudinary.com/${CLOUD}/video/upload/${textTransform(opts)}/f_mp4,q_auto/${up.public_id}.mp4`;
  } catch {
    return null;
  }
}

/** Pre-generate + cache the derived video so Instagram's fetch doesn't time out. */
export async function primeReel(url: string): Promise<boolean> {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(url);
      if (res.ok && (res.headers.get("content-type") || "").includes("video")) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}
