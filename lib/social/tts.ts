// Generates a spoken-word voiceover for a Reel using Gemini's TTS model, then
// uploads it to Cloudinary (as a video resource, so it can be muxed onto a
// video) and returns its public_id + duration.
//
// Uses the same GOOGLE/Gemini key as the text + image models. Returns null on
// any failure so callers can fall back to a silent reel.
import { cloudinary } from "@/lib/cloudinary";

const API = "https://generativelanguage.googleapis.com/v1beta";

// The "pro" TTS tier sounds noticeably more human than flash; flash is a faster
// fallback if pro is unavailable/rate-limited. Override the primary via env.
const PRIMARY_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-pro-preview-tts";
const TTS_MODELS = [...new Set([PRIMARY_MODEL, "gemini-2.5-flash-preview-tts"])];

// Warm FEMALE narrator voice. Pinned to "Sulafat" (chosen for its natural warmth)
// unless GEMINI_TTS_VOICE overrides it. NOTE: we intentionally do NOT steer an
// accent via the prompt — asking the model for a specific accent makes it refuse
// and return no audio (see synthesizeNarration).
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || "Sulafat";

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

function pickVoice(_seed: number): string {
  return DEFAULT_VOICE;
}

/**
 * Synthesize an engaging storyteller voiceover for `script`.
 * Returns the Cloudinary public_id + duration (seconds), or null on failure.
 */
export async function synthesizeNarration(
  script: string,
  opts: { voiceSeed?: number; lang?: "en" | "hi" } = {}
): Promise<{ publicId: string; durationSec: number; voice: string; url: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  const cloudinaryReady =
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!key || !cloudinaryReady || !script.trim()) return null;

  const voice = pickVoice(opts.voiceSeed ?? 0);

  // IMPORTANT: keep the spoken text free of persona/accent instructions. The TTS
  // model reliably refuses (finishReason "OTHER", NO audio) when the prompt asks
  // it to impersonate a specific accent/ethnicity (e.g. "Indian English accent"),
  // which silently produced audio-less reels. A neutral delivery directive is
  // safe; the clean script alone is the most reliable, so we fall back to it.
  // For Hindi we give the directive in Hindi too, matching the Devanagari script.
  const styled =
    opts.lang === "hi"
      ? "किसी करीबी दोस्त को कहानी सुनाने के अंदाज़ में, सहज और गर्मजोशी भरे लहज़े में, " +
        "स्वाभाविक ठहराव के साथ पढ़ें। कोई लेबल या हैशटैग न पढ़ें।\n\n" + script
      : "Read this like a real person talking to a close friend: relaxed and " +
        "conversational, warm and natural, with easy pacing and gentle emotion. Keep " +
        "it human, never robotic or monotone. Do not read any labels or hashtags.\n\n" +
        script;
  const variants = [styled, script];

  // Try the primary (pro) model first for quality, then flash as a fallback so a
  // pro outage/rate-limit never drops us all the way back to a silent reel.
  for (const model of TTS_MODELS) {
    for (const text of variants) {
      // The TTS model is occasionally flaky/rate-limited, so retry a few times.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
              },
            }),
          });
          if (!res.ok) {
            console.warn(`[tts] ${model} http ${res.status}: ${(await res.text()).slice(0, 160)}`);
            await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
            continue;
          }
          const data = await res.json();
          const cand = data?.candidates?.[0];
          const part = (cand?.content?.parts ?? []).find(
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
            const cloud = process.env.CLOUDINARY_CLOUD_NAME;
            const url = up.secure_url || `https://res.cloudinary.com/${cloud}/video/upload/${up.public_id}.mp3`;
            return { publicId: up.public_id, durationSec: up.duration || 8, voice, url };
          }
          // 200 but no audio (e.g. finishReason "OTHER") — retrying the SAME text
          // won't help, so move straight to the next (simpler) variant.
          console.warn(`[tts] ${model} no audio (finishReason=${cand?.finishReason}); trying next variant`);
          break;
        } catch (e) {
          console.warn(`[tts] ${model} request error: ${e instanceof Error ? e.message : "unknown"}`);
          await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        }
      }
    }
  }
  console.warn("[tts] narration unavailable after all variants");
  return null;
}
