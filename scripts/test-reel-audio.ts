// Local end-to-end check: narration -> ffmpeg reel -> verify the mp4 actually
// has an audio stream. Run: npx tsx scripts/test-reel-audio.ts
import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { synthesizeNarration } from "@/lib/social/tts";
import { renderNarratedReel } from "@/lib/social/ffmpeg-reel";
import { ensureCaptionBase } from "@/lib/social/caption-base";
import { sceneBgUrl, captionStripUrl } from "@/lib/social/overlay";

const exec = promisify(execFile);

async function main() {
  const beats = [
    "In the winter of nineteen forty five, a leader vanished without a trace.",
    "His disappearance sparked decades of debate across the nation.",
    "To this day, the mystery endures and his legend only grows.",
  ];
  console.log("[test] synthesizing narration…");
  const voice = await synthesizeNarration(beats.join(" "), { voiceSeed: 1 });
  if (!voice) throw new Error("narration returned null (TTS failed)");
  console.log("[test] narration OK:", voice.voice, voice.durationSec + "s", voice.url.slice(0, 70));

  const baseId = await ensureCaptionBase();
  const scenes = beats.map((caption) => ({
    bgUrl: sceneBgUrl(baseId),
    captionUrl: captionStripUrl(baseId, { caption, kicker: "TEST", accent: "F5C518" }),
  }));

  console.log("[test] rendering reel…");
  const rendered = await renderNarratedReel({ scenes, audioUrl: voice.url, weights: beats.map((b) => b.length) });
  if (!rendered) throw new Error("renderNarratedReel returned null");

  const { stdout } = await exec("ffprobe", [
    "-v", "error", "-select_streams", "a",
    "-show_entries", "stream=codec_type,codec_name,duration",
    "-of", "default=noprint_wrappers=1", rendered.path,
  ]);
  await rendered.cleanup();
  console.log("[test] mp4 audio stream:\n" + (stdout.trim() || "(none)"));
  if (!/codec_type=audio/.test(stdout)) throw new Error("NO AUDIO STREAM in output mp4");
  console.log("[test] ✅ reel has audio");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[test] FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
