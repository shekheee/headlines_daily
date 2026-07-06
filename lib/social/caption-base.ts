// The reel caption strip (see overlay.captionStripUrl) is built from a solid
// black pixel that Cloudinary scales into a rounded, semi-transparent bar. This
// module generates that 1x1 black PNG once and uploads it with a stable
// public_id so the strip URL can reference it forever.
import { deflateSync } from "node:zlib";
import { cloudinary } from "@/lib/cloudinary";

const BASE_ID = "daily-news/util/caption-base-black";

const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Deterministic 1x1 opaque black PNG as a data URI. */
function blackPixelDataUri(): string {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // width
  ihdr.writeUInt32BE(1, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const idat = deflateSync(Buffer.from([0, 0, 0, 0])); // filter 0 + black RGB
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

let cached: Promise<string> | null = null;

/** Ensures the black caption-base pixel exists in Cloudinary; returns its public_id. */
export function ensureCaptionBase(): Promise<string> {
  if (!cached) {
    cached = cloudinary.uploader
      .upload(blackPixelDataUri(), { public_id: BASE_ID, overwrite: false, resource_type: "image" })
      .then(() => BASE_ID)
      .catch(() => BASE_ID); // already exists → fine
  }
  return cached;
}
