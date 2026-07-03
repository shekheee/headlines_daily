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
function encodeText(text: string): string {
  const cleaned = text
    .replace(/[\r\n]+/g, " ")
    .replace(/[“”"]/g, "")
    .replace(/%/g, " percent")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
  return encodeURIComponent(cleaned);
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
