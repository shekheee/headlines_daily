// Renders crisp Instagram "hook" text on top of an image using Cloudinary's
// on-the-fly text overlay transformations. The image model is NOT trusted to
// render text (it misspells); Cloudinary draws it cleanly instead.
//
// Every AI image we generate is already stored in Cloudinary, so we just build
// a delivery URL with a cropped 4:5 canvas, a darkening scrim, and text layers.

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || "";

// Instagram portrait canvas (4:5) — maximum feed real estate.
const W = 1080;
const H = 1350;

// A safe, always-available Cloudinary font.
const FONT = "Arial";

/** Extract the Cloudinary public_id (incl. folder, minus extension) from a delivery URL. */
export function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (!m) return null;
  // If there were leading transformations before the version, strip them.
  const parts = m[1].split("/");
  // Heuristic: drop any leading segment that looks like a transformation (contains "_" and ",").
  return parts.join("/");
}

// Cloudinary text layers use "," and "/" as delimiters, so text must be encoded.
// encodeURIComponent turns space->%20, comma->%2C, slash->%2F which Cloudinary accepts,
// but we also strip characters that commonly break layers.
export function encodeText(text: string): string {
  const cleaned = text
    .replace(/[\r\n]+/g, " ")
    .replace(/[“”«»„"]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/£/g, " GBP ")
    .replace(/€/g, " EUR ")
    .replace(/\$/g, " USD ")
    .replace(/°/g, " deg ")
    .replace(/%/g, " percent ")
    .replace(/&/g, " and ")
    // Drop anything left outside printable ASCII so Cloudinary never 400s.
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Cloudinary uses "," and "/" as transformation delimiters, so literal commas
  // and slashes inside overlay text must be DOUBLE url-encoded.
  return encodeURIComponent(cleaned).replace(/%2C/g, "%252C").replace(/%2F/g, "%252F");
}

export interface OverlayOptions {
  kicker?: string; // small label top-left, e.g. "MONDAY MOTIVATION"
  hook: string; // the big headline
  sub?: string; // optional smaller line under the hook
  brand?: string; // small footer, e.g. "@yournishsuri"
  accent?: string; // hex (no #) for the kicker color
}

/**
 * Build a Cloudinary delivery URL that crops `publicId` to 4:5, darkens it,
 * and overlays kicker + hook + optional sub + brand text.
 */
export function overlayUrl(publicId: string, opts: OverlayOptions): string {
  const accent = opts.accent || "F5C518"; // warm gold
  const t: string[] = [];

  // 1) Canvas + gentle darken for legibility.
  t.push(`c_fill,g_auto,w_${W},h_${H}`);
  t.push(`e_brightness:-28`);

  // 2) Kicker (top-left).
  if (opts.kicker) {
    t.push(
      `co_rgb:${accent},l_text:${FONT}_46_bold_letter_spacing_2:${encodeText(
        opts.kicker.toUpperCase()
      )},g_north_west,x_72,y_96`
    );
  }

  // 3) Hook (big, bottom-left, wrapped).
  t.push(
    `co_white,l_text:${FONT}_92_bold_line_spacing_-6:${encodeText(
      opts.hook
    )},w_936,c_fit,g_south_west,x_72,y_${opts.sub ? 260 : 150}`
  );

  // 4) Optional sub line.
  if (opts.sub) {
    t.push(
      `co_rgb:e8e8e8,l_text:${FONT}_44:${encodeText(
        opts.sub
      )},w_936,c_fit,g_south_west,x_72,y_120`
    );
  }

  // 5) Brand footer (bottom-right).
  if (opts.brand) {
    t.push(
      `co_rgb:ffffff,l_text:${FONT}_34_bold:${encodeText(
        opts.brand
      )},g_south_east,x_64,y_56`
    );
  }

  t.push("f_jpg,q_auto");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${publicId}`;
}

// 9:16 canvas for Reel scene stills (Cloudinary bakes the caption; ffmpeg then
// adds motion + audio). Text sits in the lower third, inside a zoom-safe zone.
const RW = 1080;
const RH = 1920;

/**
 * Build a 9:16 captioned scene still: the image cropped/darkened with a single
 * caption (bottom, wrapped) and an optional accent kicker beneath it.
 * Used for the Reel COVER thumbnail (a static frame, so baking text is fine).
 */
export function sceneStillUrl(
  publicId: string,
  opts: { caption: string; kicker?: string; accent?: string }
): string {
  const accent = opts.accent || "F5C518";
  const t: string[] = [`c_fill,g_auto,w_${RW},h_${RH}`, "e_brightness:-30"];
  t.push(
    `co_white,l_text:${FONT}_70_bold_line_spacing_-4:${encodeText(opts.caption)},w_920,c_fit,g_south_west,x_80,y_520`
  );
  if (opts.kicker) {
    t.push(
      `co_rgb:${accent},l_text:${FONT}_44_bold_letter_spacing_2:${encodeText(opts.kicker.toUpperCase())},g_south_west,x_82,y_430`
    );
  }
  t.push("f_jpg,q_auto");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${publicId}`;
}

// Reel VIDEO scenes are composited in two layers by ffmpeg so the caption stays
// PUT: the background image gets the Ken-Burns motion, while the caption is a
// STATIC bottom strip overlaid on top (it must NOT zoom/drift with the image).

/** 9:16 background frame (no text) — this is the layer ffmpeg zooms/pans. */
export function sceneBgUrl(publicId: string): string {
  const t = [`c_fill,g_auto,w_${RW},h_${RH}`, "e_brightness:-14", "f_jpg,q_auto"];
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${publicId}`;
}

// Static caption strip dimensions (a subtitle bar pinned to the lower area).
const STRIP_W = 1080;
const STRIP_H = 360;

/**
 * Build a transparent PNG caption strip: a rounded, semi-transparent black bar
 * (from a solid black base pixel) with the wrapped caption and an optional
 * accent kicker. ffmpeg overlays this statically at the bottom of the reel.
 */
export function captionStripUrl(
  baseId: string,
  opts: { caption: string; kicker?: string; accent?: string }
): string {
  const accent = opts.accent || "F5C518";
  const t: string[] = [];
  // Semi-transparent rounded band (o_55) from the black base pixel.
  t.push(`w_${STRIP_W},h_${STRIP_H},c_scale,r_40,o_55`);
  if (opts.kicker) {
    t.push(
      `co_rgb:${accent},l_text:${FONT}_38_bold_letter_spacing_2:${encodeText(opts.kicker.toUpperCase())},g_north_west,x_64,y_44,fl_layer_apply`
    );
  }
  t.push(
    `co_white,l_text:${FONT}_50_bold_line_spacing_-2:${encodeText(opts.caption)},w_952,c_fit,g_south_west,x_64,y_48,fl_layer_apply`
  );
  t.push("f_png");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${baseId}`;
}

/** Vertical (from top) offset where the caption strip is overlaid on the reel. */
export const STRIP_Y = RH - STRIP_H - 150;

/**
 * Guaranteed 16:9 branded article image, built from a solid base pixel (see
 * ensureCaptionBase) tinted with the category colour + the headline. Used as a
 * last-resort fallback so EVERY article/card has artwork even when the image
 * model is unavailable. `color` is a hex string without the leading '#'.
 */
export function articlePlaceholderUrl(
  baseId: string,
  opts: { title: string; kicker?: string; color?: string }
): string {
  const color = (opts.color || "111827").replace(/^#/, "");
  const PW = 1280;
  const PH = 720;
  const t: string[] = [];
  // Fill the base pixel to a full-bleed panel and colourize it to the category hue.
  t.push(`w_${PW},h_${PH},c_scale`);
  t.push(`e_colorize:100,co_rgb:${color}`);
  t.push("e_brightness:-10");
  if (opts.kicker) {
    t.push(
      `co_white,l_text:${FONT}_44_bold_letter_spacing_3:${encodeText(opts.kicker.toUpperCase())},g_north_west,x_80,y_90,fl_layer_apply`
    );
  }
  t.push(
    `co_white,l_text:${FONT}_78_bold_line_spacing_-4:${encodeText(opts.title)},w_1120,c_fit,g_west,x_80,y_20,fl_layer_apply`
  );
  t.push("f_jpg,q_auto");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${baseId}`;
}

/**
 * Full-screen 9:16 Story image: headline up top and a call-to-action in the
 * lower third. Meta's API can't add link/mention STICKERS to a story, so the
 * only tappable path is the native account name at the top-left of every story
 * (→ profile → bio link). An up-arrow points people there.
 */
export function storyUrl(
  publicId: string,
  opts: { kicker?: string; hook: string; accent?: string }
): string {
  const accent = opts.accent || "F5C518";
  const t: string[] = [`c_fill,g_auto,w_${RW},h_${RH}`, "e_brightness:-30"];
  // A small arrow near the very top pointing at the (tappable) profile name.
  t.push(`co_rgb:${accent},l_text:${FONT}_60_bold:${encodeText("^ tap our name")},g_north_west,x_84,y_28`);
  // Kicker + headline.
  t.push(
    `co_rgb:${accent},l_text:${FONT}_48_bold_letter_spacing_2:${encodeText((opts.kicker || "IN THE NEWS").toUpperCase())},g_north_west,x_80,y_240`
  );
  t.push(
    `co_white,l_text:${FONT}_88_bold_line_spacing_-6:${encodeText(opts.hook)},w_920,c_fit,g_north_west,x_80,y_340`
  );
  // CTA in the lower third.
  t.push(`co_white,l_text:${FONT}_58_bold:${encodeText("READ THE FULL STORY")},g_south,y_540`);
  t.push(`co_rgb:${accent},l_text:${FONT}_46_bold:${encodeText("Link in our bio")},g_south,y_460`);
  t.push("f_jpg,q_auto");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join("/")}/${publicId}`;
}
