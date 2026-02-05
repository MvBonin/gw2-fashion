import sharp from "sharp";

export interface LosslessScreenshotOptions {
  maxWidthOrHeight?: number; // downscale ceiling (keeps crispness, reduces bytes)
  effort?: number;           // 0..6 (higher = smaller, slower)
}

const DEFAULTS: Required<LosslessScreenshotOptions> = {
  maxWidthOrHeight: 2560,
  effort: 6,
};

export interface LosslessScreenshotResult {
  buffer: Buffer;
  mime: "image/webp";
  ext: "webp";
  filename: string;
  originalBytes: number;
  outputBytes: number;
  width?: number;
  height?: number;
}

function baseName(filename?: string) {
  const f = (filename ?? "screenshot").trim();
  const noExt = f.replace(/\.[^.]+$/, "");
  return noExt || "screenshot";
}

/**
 * Always converts to lossless WebP (best for screenshots/UI/text).
 * - Auto-orients (rotate)
 * - Optionally resizes down (inside) for huge screenshots
 * - Strips metadata (smaller)
 */
export async function compressScreenshotLosslessWebp(
  inputBuffer: Buffer,
  filename?: string,
  opts: LosslessScreenshotOptions = {}
): Promise<LosslessScreenshotResult> {
  const o = { ...DEFAULTS, ...opts };
  const originalBytes = inputBuffer.byteLength;

  // Read metadata once
  const meta = await sharp(inputBuffer, { failOn: "none" }).metadata();

  let pipeline = sharp(inputBuffer, { failOn: "none" }).rotate(); // respects EXIF orientation if any

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w && h && (w > o.maxWidthOrHeight || h > o.maxWidthOrHeight)) {
    pipeline = pipeline.resize({
      width: o.maxWidthOrHeight,
      height: o.maxWidthOrHeight,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  // Strip metadata (orientation already applied)
  pipeline = pipeline.withMetadata({ orientation: undefined });

  const outBuffer = await pipeline
    .webp({
      lossless: true,
      effort: Math.min(6, Math.max(0, o.effort)),
    })
    .toBuffer();

  const name = baseName(filename);

  return {
    buffer: outBuffer,
    mime: "image/webp",
    ext: "webp",
    filename: `${name}.webp`,
    originalBytes,
    outputBytes: outBuffer.byteLength,
    width: meta.width,
    height: meta.height,
  };
}
