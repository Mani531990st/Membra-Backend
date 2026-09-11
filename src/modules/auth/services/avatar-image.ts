import convert from "heic-convert";
import sharp from "sharp";

import { ValidationError } from "@/shared/errors";

export type AllowedAvatarFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "avif"
  | "heic"
  | "heif";

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

function bufferStartsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) {
    return false;
  }
  return bytes.every((byte, index) => buffer[index] === byte);
}

function readFtypBrand(buffer: Buffer): string | null {
  // ISO BMFF: size(4) + 'ftyp'(4) + major_brand(4)
  if (buffer.length < 12) {
    return null;
  }
  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return null;
  }
  return buffer.toString("ascii", 8, 12);
}

export function detectAvatarFormat(
  buffer: Buffer,
  mimeType?: string,
): AllowedAvatarFormat {
  if (buffer.length === 0) {
    throw new ValidationError("Avatar file is empty");
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new ValidationError("Avatar file must be at most 8 MB");
  }

  const normalizedMime = mimeType?.trim().toLowerCase() ?? "";
  if (normalizedMime && !ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw new ValidationError(
      "Avatar must be JPEG, PNG, HEIC, HEIF, WebP, or AVIF",
    );
  }

  // JPEG
  if (bufferStartsWith(buffer, [0xff, 0xd8, 0xff])) {
    return "jpeg";
  }
  // PNG
  if (bufferStartsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  const brand = readFtypBrand(buffer);
  if (brand) {
    const brands = new Set<string>([brand]);
    // Collect compatible brands from the ftyp box when present.
    if (buffer.length >= 16) {
      const boxSize = buffer.readUInt32BE(0);
      const end = Math.min(buffer.length, boxSize || buffer.length);
      for (let offset = 16; offset + 4 <= end; offset += 4) {
        brands.add(buffer.toString("ascii", offset, offset + 4));
      }
    }

    if (brands.has("avif") || brands.has("avis") || brands.has("MA1B") || brands.has("MA1A")) {
      return "avif";
    }
    if (
      brands.has("heic") ||
      brands.has("heix") ||
      brands.has("hevc") ||
      brands.has("hevx") ||
      brands.has("mif1") ||
      brands.has("msf1")
    ) {
      return brands.has("heif") || normalizedMime === "image/heif" ? "heif" : "heic";
    }
    if (brands.has("heif")) {
      return "heif";
    }
  }

  throw new ValidationError(
    "Avatar must be JPEG, PNG, HEIC, HEIF, WebP, or AVIF",
  );
}

export async function decodeAvatarInput(
  buffer: Buffer,
  mimeType?: string,
): Promise<Buffer> {
  const format = detectAvatarFormat(buffer, mimeType);

  if (format === "heic" || format === "heif") {
    const jpeg = await convert({
      buffer,
      format: "JPEG",
      quality: 0.92,
    });
    return Buffer.from(jpeg);
  }

  return buffer;
}

export type AvatarVariants = {
  original: Buffer;
  medium: Buffer;
  small: Buffer;
};

export const AVATAR_MEDIUM_MAX_PX = 512;
export const AVATAR_SMALL_MAX_PX = 128;

async function encodeAvif(
  input: Buffer,
  maxEdgePx?: number,
): Promise<Buffer> {
  let pipeline = sharp(input).rotate();
  if (maxEdgePx !== undefined) {
    pipeline = pipeline.resize({
      width: maxEdgePx,
      height: maxEdgePx,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return pipeline.avif({ quality: 50 }).toBuffer();
}

/**
 * Decode once, then produce original / medium (512) / small (128) AVIF variants.
 * Medium and small fit inside the box and are not upscaled.
 */
export async function buildAvatarVariants(
  buffer: Buffer,
  mimeType?: string,
): Promise<AvatarVariants> {
  const input = await decodeAvatarInput(buffer, mimeType);

  try {
    const [original, medium, small] = await Promise.all([
      encodeAvif(input),
      encodeAvif(input, AVATAR_MEDIUM_MAX_PX),
      encodeAvif(input, AVATAR_SMALL_MAX_PX),
    ]);
    return { original, medium, small };
  } catch (error) {
    throw new ValidationError(
      "Unable to process avatar image",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export function avatarObjectKey(
  userId: string,
  slot: 1 | 2 | 3,
  revision: string,
): string {
  return `users/${userId}/avatar${slot}-${revision}.avif`;
}

export { MAX_AVATAR_BYTES };
