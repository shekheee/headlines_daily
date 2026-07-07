// Hindi (Devanagari) reel captions need a Unicode font — Cloudinary's built-in
// Arial can't draw Devanagari. Custom fonts must be uploaded as AUTHENTICATED
// raw assets and, because l_text uses "_" as a delimiter, the public_id must
// contain NO underscores. This uploads a static Noto Sans Devanagari Bold once
// (idempotent) and returns the l_text font reference ("<id>.ttf").
import { cloudinary } from "@/lib/cloudinary";

const FONT_ID = "notodevanagaribold";
export const HINDI_FONT_REF = `${FONT_ID}.ttf`;
const FONT_URL =
  "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf";

let cached: Promise<string> | null = null;

/** Ensure the Devanagari font exists in Cloudinary; returns its l_text reference. */
export function ensureDevanagariFont(): Promise<string> {
  if (!cached) {
    cached = cloudinary.uploader
      .upload(FONT_URL, { resource_type: "raw", type: "authenticated", public_id: FONT_ID, overwrite: false })
      .then(() => HINDI_FONT_REF)
      .catch(() => HINDI_FONT_REF); // already present → fine
  }
  return cached;
}
