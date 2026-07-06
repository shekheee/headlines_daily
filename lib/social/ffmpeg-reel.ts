// Assembles a 9:16 storytelling Reel with ffmpeg in two layers per scene:
//   1) a background image that gets the Ken-Burns motion (zoompan), and
//   2) a STATIC caption strip (a transparent PNG from Cloudinary) overlaid on
//      top so the subtitle stays pinned to the bottom and never drifts/zooms.
// The scenes are concatenated and the narration voiceover is muxed in. This
// keeps ffmpeg to CORE filters (scale/crop/zoompan/overlay/concat), so it works
// on the GitHub-hosted runners without needing the freetype-dependent drawtext.
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { STRIP_Y } from "@/lib/social/overlay";

const exec = promisify(execFile);
const FPS = 30;

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url.slice(0, 80)}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function probeDuration(file: string): Promise<number> {
  const { stdout } = await exec("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return Number(stdout.trim()) || 0;
}

/**
 * Render a narrated storytelling reel. Each scene is a moving background image
 * with a static caption strip pinned to the bottom. `weights` (optional) bias
 * per-scene duration (e.g. caption length) so captions stay roughly in sync
 * with the narration. Returns the mp4 path + a cleanup fn.
 */
export async function renderNarratedReel(opts: {
  scenes: { bgUrl: string; captionUrl: string }[];
  audioUrl: string;
  weights?: number[];
}): Promise<{ path: string; cleanup: () => Promise<void> } | null> {
  const scenes = opts.scenes.filter((s) => s.bgUrl && s.captionUrl).slice(0, 6);
  if (scenes.length < 1) return null;
  const n = scenes.length;

  const dir = await mkdtemp(join(tmpdir(), "reel-"));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    const audio = join(dir, "audio.mp3");
    await download(opts.audioUrl, audio);
    const D = Math.max(await probeDuration(audio), n * 1.5);

    const weights = scenes.map((_, i) => Math.max(opts.weights?.[i] ?? 1, 1));
    const wSum = weights.reduce((a, b) => a + b, 0);
    // Slight tail on total so -shortest trims to the audio, not the video.
    const durs = weights.map((w) => Math.max((w / wSum) * (D + 0.5), 1.8));

    // Inputs: all backgrounds first (0..n-1), then all caption strips (n..2n-1),
    // then the audio (2n).
    const inputs: string[] = [];
    for (let i = 0; i < n; i++) {
      const bg = join(dir, `bg${i}.jpg`);
      await download(scenes[i].bgUrl, bg);
      inputs.push("-i", bg);
    }
    for (let i = 0; i < n; i++) {
      const cap = join(dir, `cap${i}.png`);
      await download(scenes[i].captionUrl, cap);
      inputs.push("-i", cap);
    }

    const filters: string[] = [];
    for (let i = 0; i < n; i++) {
      const frames = Math.round(durs[i] * FPS);
      // Single still -> zoompan generates exactly `frames` frames (d=). Gentle
      // centered Ken-Burns zoom on the BACKGROUND only.
      filters.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,` +
          `zoompan=z='min(zoom+0.0009,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}[bg${i}]`
      );
      // Overlay the static caption strip (single frame -> repeat for the scene).
      filters.push(`[bg${i}][${n + i}:v]overlay=0:${STRIP_Y}:eof_action=repeat[v${i}]`);
    }
    const concatIn = scenes.map((_, i) => `[v${i}]`).join("");
    filters.push(`${concatIn}concat=n=${n}:v=1:a=0,format=yuv420p[vout]`);

    const out = join(dir, "reel.mp4");
    const args = [
      "-y",
      ...inputs,
      "-i", audio,
      "-filter_complex", filters.join(";"),
      "-map", "[vout]",
      "-map", `${2 * n}:a`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-r", String(FPS),
      "-shortest",
      "-movflags", "+faststart",
      out,
    ];
    await exec("ffmpeg", args, { maxBuffer: 1 << 26 });
    if (!existsSync(out)) {
      await cleanup();
      return null;
    }
    return { path: out, cleanup };
  } catch (e) {
    const err = e as { message?: string; stderr?: string };
    console.error("[ffreel] render failed:", err.message || e, err.stderr ? `\n${String(err.stderr).slice(-600)}` : "");
    await cleanup();
    return null;
  }
}
