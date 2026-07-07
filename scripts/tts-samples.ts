// Generate short narration samples across candidate voices/models and upload
// them so we can listen and pick the most human-sounding one.
//   GEMINI_API_KEY=... npx tsx scripts/tts-samples.ts
import "dotenv/config";
import { cloudinary } from "@/lib/cloudinary";

const API = "https://generativelanguage.googleapis.com/v1beta";

const SCRIPT =
  "In the winter of nineteen forty-five, a leader vanished without a trace. " +
  "Some say he escaped to freedom, while others believe he perished. " +
  "To this day, the mystery endures, and his legend only grows stronger.";

const DIRECTIVE =
  "Read this like a real person talking to a close friend: relaxed and conversational, " +
  "warm and natural, with easy pacing and gentle emotion. Keep it human, never robotic " +
  "or monotone. Do not read any labels or hashtags.";

// Warm / friendly / natural prebuilt voices worth auditioning.
const VOICES = ["Sulafat", "Achird", "Callirrhoe", "Aoede", "Despina", "Vindemiatrix", "Leda"];
// flash is fast; pro is higher quality. Audition a few on pro too.
const COMBOS: { voice: string; model: string }[] = [
  ...VOICES.map((voice) => ({ voice, model: "gemini-2.5-flash-preview-tts" })),
  ...["Sulafat", "Achird", "Callirrhoe"].map((voice) => ({ voice, model: "gemini-2.5-pro-preview-tts" })),
];

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function sample(voice: string, model: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY!;
  const res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${DIRECTIVE}\n\n${SCRIPT}` }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    }),
  });
  if (!res.ok) { console.warn(`  ${voice}/${model}: http ${res.status}`); return null; }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const part = (cand?.content?.parts ?? []).find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData);
  const b64 = part?.inlineData?.data;
  if (!b64) { console.warn(`  ${voice}/${model}: no audio (finish=${cand?.finishReason})`); return null; }
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1] || 24000);
  const wav = pcmToWav(Buffer.from(b64, "base64"), rate);
  const tag = model.includes("pro") ? "pro" : "flash";
  const up = await cloudinary.uploader.upload(`data:audio/wav;base64,${wav.toString("base64")}`, {
    resource_type: "video",
    folder: "daily-news/tts-samples",
    public_id: `${voice}-${tag}`,
    overwrite: true,
  });
  return up.secure_url;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  const rows: string[] = [];
  for (const { voice, model } of COMBOS) {
    const url = await sample(voice, model);
    if (url) {
      const tag = model.includes("pro") ? "pro" : "flash";
      rows.push(`${voice} (${tag}): ${url}`);
      console.log(`  ✓ ${voice} (${tag})`);
    }
  }
  console.log("\n===== SAMPLES =====");
  for (const r of rows) console.log(r);
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1); });
