// Generates a spoken-word voiceover for a Reel using Gemini's TTS model, then
// uploads it to Cloudinary (as a video resource, so it can be muxed onto a
// video) and returns its public_id + duration.
//
// Uses the same GOOGLE/Gemini key as the text + image models. Returns null on
// any failure so callers can fall back to a silent reel.
import { cloudinary } from "@/lib/cloudinary";

const API = "https://generativelanguage.googleapis.com/v1beta";
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";

// Warm, expressive narrator voices. Rotated for variety unless GEMINI_TTS_VOICE
// pins a specific one. (Prebuilt Gemini voices.)
const NARRATOR_VOICES = ["Charon", "Enceladus", "Algieba", "Sulafat", "Iapetus"];

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  h.writeUInt16LE(2, 32); // block align
  h.writeUInt16LE(16, 34); // bits per sample
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function pickVoice(seed: number): string {
  if (process.env.GEMINI_TTS_VOICE) return process.env.GEMINI_TTS_VOICE;
  return NARRATOR_VOICES[Math.abs(seed) % NARRATOR_VOICES.length];
}

/**
 * Synthesize an engaging storyteller voiceover for `script`.
 * Returns the Cloudinary public_id + duration (seconds), or null on failure.
 */
export async function synthesizeNarration(
  script: string,
  opts: { voiceSeed?: number } = {}
): Promise<{ publicId: string; durationSec: number; voice: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!key || !cloudinaryReady || !script.trim()) return null;

  const voice = pickVoice(opts.voiceSeed ?? 0);
  const prompt =
    "Narrate this like a captivating history storyteller for a short video — warm, " +
    "vivid and human, with natural dramatic pauses. Do not read any labels or hashtags, " +
    "just tell the story:\n\n" +
    script;

  // The preview TTS model is occasionally flaky/rate-limited, so retry a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API}/models/${TTS_MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const part = (data?.candidates?.[0]?.content?.parts ?? []).find(
          (p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData
        );
        const b64 = part?.inlineData?.data;
        if (b64) {
          const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1] || 24000);
          const wav = pcmToWav(Buffer.from(b64, "base64"), rate);
          const up = await cloudinary.uploader.upload(`data:audio/wav;base64,${wav.toString("base64")}`, {
            resource_type: "video",
            folder: "daily-news/tts",
          });
          return { publicId: up.public_id, durationSec: up.duration || 8, voice };
        }
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}
