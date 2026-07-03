// Generates an original editorial header image for an article using Gemini's
// image model, then uploads it to Cloudinary and returns a public URL.
//
// Uses the same GOOGLE/Gemini key as the text rewriter. Falls back to null on any
// failure so callers can keep the source (RSS) image instead.
import { uploadImage } from "@/lib/cloudinary";

const API = "https://generativelanguage.googleapis.com/v1beta";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

function buildImagePrompt(input: { title: string; category: string; excerpt?: string }): string {
  return [
    `Create a high-quality, photorealistic editorial news header image for a ${input.category} story.`,
    `Headline: "${input.title}".`,
    input.excerpt ? `Context: ${input.excerpt}` : "",
    "Style: cinematic, photojournalistic, natural lighting, rich detail, 16:9 landscape composition suitable for a news website hero image.",
    "Strict rules: absolutely NO text, letters, numbers, captions, logos, or watermarks anywhere in the image.",
    "Do NOT depict real, identifiable public figures, politicians, or celebrities — use anonymous people or symbolic, contextual scenes instead.",
    "Keep it tasteful, neutral and appropriate for a general news audience.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Generate an image from a raw prompt. Returns a base64 data URI or null. */
export async function generateImageDataUri(
  prompt: string,
  aspectRatio: "16:9" | "4:5" | "1:1" = "16:9"
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  try {
    const res = await fetch(`${API}/models/${IMAGE_MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData);
    if (!img?.inlineData?.data) return null;
    const mime = img.inlineData.mimeType || "image/jpeg";
    return `data:${mime};base64,${img.inlineData.data}`;
  } catch {
    return null;
  }
}

/** Generate an image from a raw prompt and upload to Cloudinary. Returns {url, publicId} or null. */
export async function generateAndHostImage(
  prompt: string,
  aspectRatio: "16:9" | "4:5" | "1:1" = "4:5"
): Promise<{ url: string; publicId: string } | null> {
  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!cloudinaryReady) return null;
  const dataUri = await generateImageDataUri(prompt, aspectRatio);
  if (!dataUri) return null;
  try {
    const uploaded = await uploadImage(dataUri, "daily-news/social");
    return { url: uploaded.url, publicId: uploaded.publicId };
  } catch {
    return null;
  }
}

/** Returns a base64 data URI for a generated article header image, or null on failure. */
export async function generateArticleImageDataUri(input: {
  title: string;
  category: string;
  excerpt?: string;
}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body = {
    contents: [{ role: "user", parts: [{ text: buildImagePrompt(input) }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "16:9" },
    },
  };

  try {
    const res = await fetch(`${API}/models/${IMAGE_MODEL}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData);
    if (!img?.inlineData?.data) return null;
    const mime = img.inlineData.mimeType || "image/jpeg";
    return `data:${mime};base64,${img.inlineData.data}`;
  } catch {
    return null;
  }
}

/**
 * Generates an image and uploads it to Cloudinary.
 * Returns the public secure URL, or null if generation/upload/config is unavailable.
 */
export async function generateAndHostArticleImage(input: {
  title: string;
  category: string;
  excerpt?: string;
}): Promise<string | null> {
  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;
  if (!cloudinaryReady) return null;

  const dataUri = await generateArticleImageDataUri(input);
  if (!dataUri) return null;

  try {
    const uploaded = await uploadImage(dataUri, "daily-news/ai");
    return uploaded.url;
  } catch {
    return null;
  }
}
