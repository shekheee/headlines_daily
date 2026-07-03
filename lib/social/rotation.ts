// Anti-repetition engine.
//
// Every 2 weeks the whole Instagram look rotates to a different "style pack":
// a new photographic aesthetic + a new color palette. Within a single day's
// batch, accent colors also cycle so no two posts look identical.
//
// To add variety over time, just append more packs below — the rotation picks
// them up automatically.

export interface StylePack {
  name: string;
  imageStyle: string; // appended to every image prompt this fortnight
  palette: string[]; // accent hexes (no #) cycled across posts
}

export const STYLE_PACKS: StylePack[] = [
  {
    name: "Cinematic Photojournalism",
    imageStyle:
      "Style: cinematic photojournalism, natural dramatic light, shallow depth of field, rich warm color grade, editorial realism.",
    palette: ["F5C518", "FF6B6B", "2EC4B6", "8ECAE6", "FF9F1C"],
  },
  {
    name: "Bold High-Contrast Editorial",
    imageStyle:
      "Style: bold high-contrast editorial photography, strong shadows, punchy saturated colors, striking composition, magazine-cover energy.",
    palette: ["FFD23F", "FB5607", "FF006E", "3A86FF", "8338EC"],
  },
  {
    name: "Minimal Modern",
    imageStyle:
      "Style: clean minimalist modern photography, soft even light, muted sophisticated palette, generous negative space, calm and premium.",
    palette: ["E9C46A", "E76F51", "2A9D8F", "264653", "F4A261"],
  },
  {
    name: "Vintage Film",
    imageStyle:
      "Style: vintage 35mm film look, warm grain, faded earthy tones, nostalgic documentary mood, analog texture.",
    palette: ["D4A373", "BC6C25", "606C38", "A98467", "CB997E"],
  },
  {
    name: "Neon Night",
    imageStyle:
      "Style: dramatic night photography, neon and city lights, deep blues and electric accents, moody atmospheric haze, cinematic.",
    palette: ["06D6A0", "118AB2", "EF476F", "FFD166", "9B5DE5"],
  },
  {
    name: "Natural Daylight Documentary",
    imageStyle:
      "Style: bright natural daylight documentary photography, authentic candid feel, true-to-life colors, crisp and clean.",
    palette: ["43AA8B", "F9C74F", "F8961E", "577590", "F94144"],
  },
];

const DAY_MS = 86_400_000;

/** Which fortnight bucket a date falls in (changes every 14 days). */
export function fortnightIndex(date = new Date()): number {
  return Math.floor(date.getTime() / DAY_MS / 14);
}

/** The active style pack for a given date (rotates every 2 weeks). */
export function getStylePack(date = new Date()): StylePack {
  return STYLE_PACKS[fortnightIndex(date) % STYLE_PACKS.length];
}

/** Pick an accent color for post index `i`, offset by the fortnight so palettes shift too. */
export function accentFor(pack: StylePack, i: number, date = new Date()): string {
  const offset = fortnightIndex(date);
  return pack.palette[(i + offset) % pack.palette.length];
}
