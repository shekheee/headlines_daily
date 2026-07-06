// Assembles a 9:16 storytelling Reel with ffmpeg from pre-composited scene
// stills (captions are already baked on by Cloudinary — see sceneStillUrl).
// ffmpeg only adds the Ken-Burns motion, concatenates the scenes, and muxes the
// narration voiceover. This keeps ffmpeg to CORE filters (zoompan/concat/scale),
// so it works on the GitHub-hosted runners (and locally) without needing the
// freetype-dependent drawtext filter.
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

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
 * Render a narrated storytelling reel from composited scene stills + a voiceover.
 * `weights` (optional) bias per-scene duration (e.g. caption length) so captions
 * stay roughly in sync with the narration. Returns the mp4 path + a cleanup fn.
 */
export async function renderNarratedReel(opts: {
  stillUrls: string[];
  audioUrl: string;
  weights?: number[];
}): Promise<{ path: string; cleanup: () => Promise<void> } | null> {
  const stills = opts.stillUrls.filter(Boolean).slice(0, 6);
  if (stills.length < 1) return null;

  const dir = await mkdtemp(join(tmpdir(), "reel-"));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  try {
    const audio = join(dir, "audio.mp3");
    await download(opts.audioUrl, audio);
    const D = Math.max(await probeDuration(audio), stills.length * 1.5);

    const weights = stills.map((_, i) => Math.max(opts.weights?.[i] ?? 1, 1));
    const wSum = weights.reduce((a, b) => a + b, 0);
    // Slight tail on total so -shortest trims to the audio, not the video.
    const durs = weights.map((w) => Math.max((w / wSum) * (D + 0.5), 1.8));

    const inputs: string[] = [];
    const filters: string[] = [];
    for (let i = 0; i < stills.length; i++) {
      const img = join(dir, `s${i}.jpg`);
      await download(stills[i], img);
      inputs.push("-i", img);
      const frames = Math.round(durs[i] * FPS);
      // Single still -> zoompan generates exactly `frames` frames (d=). Feeding a
      // looped stream here would multiply frames per input frame — a common bug.
      // Gentle centered Ken-Burns zoom (captions were baked inside the zoom-safe zone).
      filters.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,` +
          `zoompan=z='min(zoom+0.0009,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}[v${i}]`
      );
    }
    const concatIn = stills.map((_, i) => `[v${i}]`).join("");
    filters.push(`${concatIn}concat=n=${stills.length}:v=1:a=0,format=yuv420p[vout]`);

    const out = join(dir, "reel.mp4");
    const args = [
      "-y",
      ...inputs,
      "-i", audio,
      "-filter_complex", filters.join(";"),
      "-map", "[vout]",
      "-map", `${stills.length}:a`,
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
