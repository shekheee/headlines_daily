// Custom next/image loader. Our images are already hosted on Cloudinary, which
// optimises far better than Vercel's optimiser — and routing every <Image>
// through Vercel burns the (5,000/mo) Image Optimization free tier. This loader
// makes Cloudinary do the resizing/format work via URL transforms, so Vercel's
// optimiser is bypassed entirely (≈0 transformations billed).
//
// Non-Cloudinary URLs (e.g. Google OAuth avatars) are returned untouched.

const UPLOAD_MARKER = "/image/upload/";

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const idx = src.indexOf(UPLOAD_MARKER);
  if (!src.includes("res.cloudinary.com") || idx === -1) return src;

  // f_auto = best format (AVIF/WebP), q_auto = smart quality, c_limit = never
  // upscale past the original, w_<width> = the responsive width Next requests.
  const params = ["f_auto", `q_${quality ?? "auto"}`, "c_limit", `w_${width}`].join(",");
  const head = src.slice(0, idx + UPLOAD_MARKER.length);
  const tail = src.slice(idx + UPLOAD_MARKER.length);
  return `${head}${params}/${tail}`;
}
