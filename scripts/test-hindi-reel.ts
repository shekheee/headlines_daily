// Hindi end-to-end: Devanagari caption strip + Hindi narration + ffmpeg render.
// Verifies the caption image renders (200) and the mp4 has an audio stream.
//   GEMINI_API_KEY=... npx tsx scripts/test-hindi-reel.ts
import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { synthesizeNarration } from "@/lib/social/tts";
import { renderNarratedReel } from "@/lib/social/ffmpeg-reel";
import { ensureCaptionBase } from "@/lib/social/caption-base";
import { ensureDevanagariFont } from "@/lib/social/hindi-font";
import { sceneBgUrl, captionStripUrl } from "@/lib/social/overlay";

const exec = promisify(execFile);

async function main() {
  const captions = [
    "सन 1945 की सर्दियों में एक नेता अचानक गायब हो गया।",
    "उनके गायब होने से दशकों तक बहस छिड़ी रही।",
    "आज भी यह रहस्य बरकरार है और उनकी कहानी और मशहूर होती गई।",
  ];
  const kicker = "इतिहास";

  const font = await ensureDevanagariFont();
  const baseId = await ensureCaptionBase();
  console.log("[hi] font ref:", font);

  // Confirm the Devanagari caption strip actually renders.
  const capUrl = captionStripUrl(baseId, { caption: captions[0], kicker, accent: "F5C518", font, unicode: true });
  const capRes = await fetch(capUrl);
  console.log("[hi] caption strip:", capRes.status, capRes.headers.get("content-type"));
  if (!capRes.ok) throw new Error("Hindi caption strip failed to render");

  console.log("[hi] synthesizing Hindi narration…");
  const voice = await synthesizeNarration(captions.join(" "), { voiceSeed: 1, lang: "hi" });
  if (!voice) throw new Error("Hindi narration returned null");
  console.log("[hi] narration OK:", voice.voice, voice.durationSec + "s");

  const scenes = captions.map((c) => ({
    bgUrl: sceneBgUrl(baseId),
    captionUrl: captionStripUrl(baseId, { caption: c, kicker, accent: "F5C518", font, unicode: true }),
  }));

  console.log("[hi] rendering reel…");
  const rendered = await renderNarratedReel({ scenes, audioUrl: voice.url, weights: captions.map((c) => c.length) });
  if (!rendered) throw new Error("renderNarratedReel returned null");
  const { stdout } = await exec("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type,duration", "-of", "default=noprint_wrappers=1", rendered.path]);
  await rendered.cleanup();
  console.log("[hi] audio stream:\n" + (stdout.trim() || "(none)"));
  if (!/codec_type=audio/.test(stdout)) throw new Error("NO AUDIO in Hindi reel");
  console.log("[hi] ✅ Hindi reel has Devanagari captions + audio");
}

main().then(() => process.exit(0)).catch((e) => { console.error("[hi] FAILED:", e instanceof Error ? e.message : e); process.exit(1); });
